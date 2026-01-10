# x-word

web component to render a crossword from an ipuz file

## behavior

### clues
- click clue
    - highlight cells
    - focus first empty cell
    - if all cells are filled, focus first cell
- show active clue on top, allow navigating to prev/next clues

### cells
- click cell
    - make cell active
    - check current direction, select clue for that direction
- click active cell
    - switch direction, select clue

### navigation
- letter key -> moves to next cell
- arrow keys
    - currently on an across clue:
        - left, right moves cells.
        - top, down (if cell exists) switches direction and clue
        - pressed right on the last cell -> next clue
        - pressed left on the first cell -> prev clue
    - currently on a down clue:
        - top, down moves cells
        - left, right (if cell exists) switches direction and clue
        - pressed top on first cell -> prev clue
        - pressed down on last cell -> next clue
