package com.purplepiggy.app;

import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (this.bridge != null && this.bridge.getWebView() != null) {
            final WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setSupportMultipleWindows(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);

            // Permitir cookies de terceiros necessários para o widget iframe do Pluggy Connect (Open Finance)
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

            // Interceptar window.open / target="_blank" do widget Pluggy Connect mantendo o suporte nativo a arquivos, câmera e permissões
            webView.setWebChromeClient(new BridgeWebChromeClient(this.bridge) {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    WebView tempWebView = new WebView(view.getContext());
                    tempWebView.getSettings().setJavaScriptEnabled(true);
                    tempWebView.setWebViewClient(new WebViewClient() {
                        private boolean handled = false;

                        private void launchExternalBankOrBrowser(String url) {
                            if (handled || url == null || url.isEmpty() || url.equals("about:blank")) {
                                return;
                            }
                            handled = true;
                            try {
                                Intent intent;
                                if (url.startsWith("intent://")) {
                                    intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                                } else {
                                    intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                                }
                                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                view.getContext().startActivity(intent);
                            } catch (Exception e) {
                                try {
                                    Intent fallback = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    view.getContext().startActivity(fallback);
                                } catch (Exception ignored) {
                                }
                            }
                        }

                        @Override
                        public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && request != null && request.getUrl() != null) {
                                launchExternalBankOrBrowser(request.getUrl().toString());
                                return true;
                            }
                            return false;
                        }

                        @Override
                        public boolean shouldOverrideUrlLoading(WebView v, String url) {
                            launchExternalBankOrBrowser(url);
                            return true;
                        }

                        @Override
                        public void onPageStarted(WebView v, String url, Bitmap favicon) {
                            launchExternalBankOrBrowser(url);
                        }
                    });

                    WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                    transport.setWebView(tempWebView);
                    resultMsg.sendToTarget();
                    return true;
                }
            });
        }
    }
}
