# Musical Fractal

Final project for Internet Art.

Randomly chooses a sequence of 4 steps, then recursively generates a melody of these steps (for each step, create and play the melody with that step as the base, one level of recursion down).

The recursive function generates 3 melodies and an image. For each note, the 3 frequencies are scaled between 0 and 255, together defining a color. A square of this color is added to the image at the same time the note is played.