# event-sequences-handler

```js
var eventTarget = new EventSequencesTarget();

eventTarget.addEventListener('keydown(s)', e => {
  console.log('keydown s');
});

eventTarget.addEventListener('keydown(Shift)|drag(.item)', e => {
  console.log('dragging \'.item\' after keydown shift', e);
});
```

Read the file test/index.html for more examples

## Supported events

### Key Events

See [key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) and [code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) at MDN

* keydown(key or code)
* keyup(key or code)

### Mouse Events

* move()
* click(selector)
* drag(selector)
* drop(selector)

## Rules

* There should be only one mouse event in event sequences.
* the event which of type is 'keyup', 'click', 'drop' should be last position.

## TODOs

* semantic checks
* event propagation
* bubble up mouse match
* nokeydown option (ex. move with no keydowns)
* only option at keydown events (ex. only (shift + A) and drag)
* add bundler
