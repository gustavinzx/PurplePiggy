from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
arr = np.array(img)

# Given hints:
# col x starts: ~52, 300, 548, 797, 1046
# row y starts: ~125, 473, 825

# Let's inspect the bezel positions for all 5 columns:
# We can find the bezel left/right by scanning horizontal slices at y = 250 (row 0), y = 600 (row 1), y = 950 (row 2)
# A phone frame is characterized by:
# background (bright lilac) -> outer shadow/bezel -> dark border (RGB < 60) -> inner screen -> dark border (RGB < 60) -> background

def find_phone_x_ranges(y):
    row_slice = arr[y]
    # find where dark bezel pixels occur (e.g. brightness < 60)
    # but inside the phone, some UI might be dark or icons might be dark
    # So let's look around the column hints:
    col_hints = [52, 300, 548, 797, 1046]
    ranges = []
    for ch in col_hints:
        # scan from ch to ch + 30 for left bezel -> inner screen transition
        # find the dark bezel
        left_bezel_end = None
        for x in range(ch, ch + 25):
            # check if arr[y, x] is dark bezel and arr[y, x+1] jumps up to screen
            b_curr = np.mean(row_slice[x][:3])
            b_next = np.mean(row_slice[x+1][:3])
            if b_curr < 60 and b_next > 100:
                left_bezel_end = x + 1
                break
        
        # scan for right inner screen -> right bezel
        right_bezel_start = None
        for x in range(ch + 190, ch + 230):
            b_curr = np.mean(row_slice[x][:3])
            b_next = np.mean(row_slice[x+1][:3])
            if b_curr > 100 and b_next < 60:
                right_bezel_start = x + 1 # exclusive bound
                break
        ranges.append((left_bezel_end, right_bezel_start))
    return ranges

print("Col X ranges row 0 (y=250):", find_phone_x_ranges(250))
print("Col X ranges row 1 (y=600):", find_phone_x_ranges(600))
print("Col X ranges row 2 (y=950):", find_phone_x_ranges(950))
