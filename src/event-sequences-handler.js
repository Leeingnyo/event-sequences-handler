// TODO 진짜 드래그 앤 드랍 이벤트 어쩔건데

// mouse relative
// mousedown { raw, name, x, y, target }
// mousemove { raw, name, x, y }
// mouseup { raw, name, x, y }

// key relative
// keydown { raw, name, key, code, first, last }
// keyup { raw, name, key, code }

class EventSequencesTarget {
  dom = null;
  eventHistory = [];
  listeners = {};

  constructor(dom, options, Parser = EventSequencesParser) {
    this.options = options = options ||
        dom && Object.getPrototypeOf(dom) === Object.prototype ? dom : null ||
        { preventInputTagKeyEvent: true };
    this.dom = dom || window;

    this.parser = new Parser(); // ?

    this.keydown = this.keydown.bind(this);
    this.keyup = this.keyup.bind(this);
    this.mousedown = this.mousedown.bind(this);
    this.mousemove = this.mousemove.bind(this);
    this.mouseup = this.mouseup.bind(this);
    this.blur = this.blur.bind(this);

    this.bind();
  }

  preventKeyboardEvent(event) {
    if (this.options.preventInputTagKeyEvent &&
        (event.target.matches('input') ||
        event.target.matches('textarea'))) {
      return true;
    }

    return false;
  }
  keydown(event) {
    if (this.preventKeyboardEvent(event)) {
      return;
    }

    var ev = this.reverseFind(s => s.name === 'keydown' && s.code === event.code && s.key === event.key);
    if (ev) {
      ev.last = new Date();
    } else {
      ev = {
        raw: event,
        name: 'keydown',
        code: event.code,
        key: event.key,
        first: new Date(),
        last: new Date()
      };

      this.eventHistory.push(ev);
    }

    this.emit();
  }
  keyup(event) {
    if (this.preventKeyboardEvent(event)) {
      return;
    }

    const ev = {
      raw: event,
      name: 'keyup',
      code: event.code,
      key: event.key,
    };
    this.eventHistory.push(ev);

    this.emit();

    var indexOfSameKeydown = this.reverseFindIndex(s => s.name === 'keydown' && s.code === event.code && s.key === event.key);
    if (indexOfSameKeydown >= 0) {
      this.eventHistory.splice(indexOfSameKeydown, 1);
    }
    this.eventHistory.pop();
  }
  blur(event) {
    console.log(event);
    for (var i = this.eventHistory.length - 1; i >= 0; i--) {
      var ev = this.eventHistory[i];
      if (ev.name === 'keydown') {
        this.eventHistory.splice(i, 1);
      }
    }
  }

  getCurrentXY(event) {
    var target = window === event.currentTarget || document === event.currentTarget ? document.body : event.currentTarget;
    var targetPos = getPosition(target);
    var x = event.clientX - targetPos.x;
    var y = event.clientY - targetPos.y;
    return { x, y };
  }
  mousedown(event) {
    var { x, y } = this.getCurrentXY(event);

    var indexOfSameKeydown = this.reverseFindIndex(s => s.name === 'mousedown');
    if (indexOfSameKeydown >= 0) {
      this.eventHistory.splice(indexOfSameKeydown, 1);
    }

    var ev = {
      raw: event,
      name: 'mousedown',
      x,
      y,
      target: event.target
    };
    this.eventHistory.push(ev);

    this.emit();
  }
  mousemove(event) {
    var { x, y } = this.getCurrentXY(event);
    if (this.latestEvent?.name === 'mousemove') {
      this.latestEvent.x = x;
      this.latestEvent.y = y;
    } else {
      var latestMousemove = this.reverseFind(s => s.name === 'mousemove');
      if (latestMousemove) {
        var index = this.eventHistory.indexOf(latestMousemove);
        this.eventHistory.splice(index, 1);
        latestMousemove.x = x;
        latestMousemove.y = y;
        this.eventHistory.push(latestMousemove);
      } else {
        var ev = {
          raw: event,
          name: 'mousemove',
          x,
          y
        };
        this.eventHistory.push(ev);
      }
    }

    this.emit();
  }
  mouseup(event) {
    var { x, y } = this.getCurrentXY(event);

    var ev = {
      raw: event,
      name: 'mouseup',
      x,
      y
    };
    this.eventHistory.push(ev);

    this.emit();

    var indexOfSameKeydown = this.reverseFindIndex(s => s.name === 'mousedown');
    if (indexOfSameKeydown >= 0) {
      this.eventHistory.splice(indexOfSameKeydown, 1);
    }
    this.eventHistory.pop();
  }

  bind() {
    window.addEventListener('blur', this.blur);
    this.dom.addEventListener('keydown', this.keydown);
    this.dom.addEventListener('keyup', this.keyup);
    this.dom.addEventListener('mousedown', this.mousedown);
    this.dom.addEventListener('mousemove', this.mousemove);
    this.dom.addEventListener('mouseup', this.mouseup);
  }
  unbind() {
    window.removeEventListener('blur', this.blur);
    this.dom.removeEventListener('keydown', this.keydown);
    this.dom.removeEventListener('keyup', this.keyup);
    this.dom.removeEventListener('mousedown', this.mousedown);
    this.dom.removeEventListener('mousemove', this.mousemove);
    this.dom.removeEventListener('mouseup', this.mouseup);
  }

  reverseFind(predicate, thisArg = undefined) {
    for (var i = this.eventHistory.length - 1; i >= 0; i--) {
      if (predicate(this.eventHistory[i])) {
        return this.eventHistory[i];
      }
    }
  }

  reverseFindIndex(predicate, thisArg = undefined) {
    for (var i = this.eventHistory.length - 1; i >= 0; i--) {
      if (predicate(this.eventHistory[i])) {
        return i;
      }
    }
    return -1;
  }

  get latestEvent() {
    return this.eventHistory[this.eventHistory.length - 1] || null;
  }

  get isMousedown() {
    return !!this.reverseFind(s => s.name === 'mousedown');
  }
  get mousedownX() {
    return this.reverseFind(s => s.name === 'mousedown')?.x || null;
  }
  get mousedownY() {
    return this.reverseFind(s => s.name === 'mousedown')?.y || null;
  }
  get mouseX() {
    return this.reverseFind(s => s.name.startsWith('mouse'))?.x || null;
  }
  get mouseY() {
    return this.reverseFind(s => s.name.startsWith('mouse'))?.y || null;
  }
  get mousedownTarget() {
    return this.reverseFind(s => s.name === 'mousedown')?.target || null;
  }

  isKeydown(key, code, strictly = false) {
    return !!this.reverseFind(s => s.name === 'keydown' && strictly ? (s.key === key && s.code === code) : (s.key === key || s.code === code));
  }

  emit() {
    var listenerKeys = Object.keys(this.listeners);
    listener:
    for (const key of listenerKeys) {
      const listeners = this.listeners[key];
      const eventSeries = this.parser.eventSeriesCache[key];

      function emit(event) {
        for (var listener of listeners) {
          try {
            listener(event);
          } catch (e) {
            console.error(e);
          }
        }
      }

      // ???
      const lastEvent = eventSeries[eventSeries.length - 1];
      switch (lastEvent?.name) {
        case 'click': {
          // 마우스 업이어야 함
          if (this.latestEvent.name !== 'mouseup') {
            continue;
          }
          // 타겟에서 떼야 함
          if (!this.mousedownTarget.matches(lastEvent.target)) {
            continue;
          }
          // 다운보다 무브가 뒤에 있으면 클릭이 아님 드랍임
          var mousedownIndex = this.eventHistory.findIndex(s => s.name === 'mousedown');
          var mousemoveIndex = this.eventHistory.findIndex(s => s.name === 'mousemove');
          if (mousemoveIndex > mousedownIndex) {
            continue;
          }

          // 선행 조건 만족하는지 살펴보기
          // 클릭이면 근데 마우스 다운 이전 걸 봐야하나
          for (var i = eventSeries.length - 2; i >= 0; i--) {
            var condition = eventSeries[i];
            if (condition.name === 'keydown') {
              if (!this.isKeydown(condition.target, condition.target)) {
                continue listener;
              }
            }
          }

          emit({
            rawEvents: [this.latestEvent],
            x: this.mouseX,
            y: this.mouseY,
            target: this.mousedownTarget
          });
          break;
        }
        case 'move': {
          // 움직인다!
          if (this.latestEvent.name !== 'mousemove') {
            continue;
          }
          // 뭐 누르고 있으면 드래그임
          if (this.isMousedown) {
            continue;
          }

          // 선행 조건 만족하는지 살펴보기
          // 마우스 이벤트의 선행 조건은 키 다운 뿐 같음
          for (var i = eventSeries.length - 2; i >= 0; i--) {
            var condition = eventSeries[i];
            if (condition.name === 'keydown') {
              if (!this.isKeydown(condition.target, condition.target)) {
                continue listener;
              }
            }
          }

          emit({
            rawEvents: [this.latestEvent],
            x: this.mouseX,
            y: this.mouseY
          });
          break;
        }
        case 'drag': {
          // 움직인다!
          if (this.latestEvent.name !== 'mousemove') {
            continue;
          }
          // 뭐 누르고 있지 않으면 무브임
          if (!this.isMousedown) {
            continue;
          }
          // 타겟을 잡고 있어야 함
          if (!this.mousedownTarget.matches(lastEvent.target)) {
            continue;
          }

          // 선행 조건 만족하는지 살펴보기
          // 드래그에서는 마우스 다운 이전 키 다운만 봐야하나?
          var mousedownEventIndex = this.reverseFindIndex(s => s.name === 'mousedown');
          if (mousedownEventIndex === 0) continue;
          for (var i = mousedownEventIndex - 1; i >= 0; i--) {
            var condition = eventSeries[i];
            if (condition.name === 'keydown') {
              if (!this.isKeydown(condition.target, condition.target)) {
                continue listener;
              }
            }
          }

          emit({
            rawEvents: [this.reverseFind(s => s.name === 'mousedown'), this.latestEvent],
            x: this.mouseX,
            y: this.mouseY,
            target: this.mousedownTarget
          });
          break;
        }
        case 'drop': {
          if (this.latestEvent.name !== 'mouseup') {
            continue;
          }
          if (!this.isMousedown) {
            continue;
          }
          // 타겟을 놓은 것이어야 함
          if (!this.mousedownTarget.matches(lastEvent.target)) {
            continue;
          }
          // 다운보다 무브가 뒤에 있으면 드랍이 아님 클릭임
          var mousedownIndex = this.eventHistory.findIndex(s => s.name === 'mousedown');
          var mousemoveIndex = this.eventHistory.findIndex(s => s.name === 'mousemove');
          if (mousemoveIndex < mousedownIndex) {
            continue;
          }

          // 선행 조건 만족하는지 살펴보기
          // 드랍도 마우스 다운 이전 키 다운만 봐야하나?
          var mousedownEventIndex = this.reverseFindIndex(s => s.name === 'mousedown');
          if (mousedownEventIndex === 0) continue;
          for (var i = mousedownEventIndex - 1; i >= 0; i--) {
            var condition = eventSeries[i];
            if (condition.name === 'keydown') {
              if (!this.isKeydown(condition.target, condition.target)) {
                continue listener;
              }
            }
          }

          emit({
            rawEvents: [this.latestEvent],
            x: this.mouseX,
            y: this.mouseY,
            target: this.mousedownTarget
          });
          break;
        }
        case 'keydown': {
          if (this.latestEvent.name !== 'keydown') {
            continue;
          }
          if (lastEvent.target !== this.latestEvent.raw.key &&
              lastEvent.target !== this.latestEvent.raw.code) {
            continue;
          }

          emit({
            rawEvents: [this.latestEvent],
            key: this.latestEvent.raw.key,
            code: this.latestEvent.raw.code
          });
          break;
        }
        case 'keyup': {
          if (this.latestEvent.name !== 'keyup') {
            continue;
          }

          // 선행 조건 만족하는지 살펴보기
          // TODO

          emit({
            rawEvents: [this.latestEvent],
            key: this.latestEvent.raw.key,
            code: this.latestEvent.raw.code
          });
          break;
        }
      }
    }
  }

  addEventListener(eventSeries, listener) {
    if (this.parser.parseEventSeries(eventSeries) !== null) {
      (this.listeners[eventSeries] = this.listeners[eventSeries] || []).push(listener);
    }
  }

  removeEventListener(eventSeries, listener) {
    var index = this.listeners[eventSeries].findIndex(l => l === listener);
    this.listeners[eventSeries].splice(index, 1);
    if (this.listeners[eventSeries].length === 0) {
      delete this.listeners[eventSeries];
      delete this.parser.eventSeriesCache[eventSeries];
    }
  }
}

class EventSequencesParser {
  eventSeriesCache = {};

  parseEventSeries(eventSeries) { // string
    if (this.eventSeriesCache[eventSeries]) {
      return this.eventSeriesCache[eventSeries];
    }

    // tokenize
    // token type
    // { type: STRING, value: string }
    // { type: open_bracket }
    // { type: close_bracket }
    // { type: separator }
    const
        T_STRING = 'T_STRING',
        T_OPEN_BRACKET = 'T_OPEN_BRACKET',
        T_CLOSE_BRACKET = 'T_CLOSE_BRACKET',
        T_SEPARATOR = 'T_SEPARATOR';
    const separator = '|';

    const tokens = [];
    var buffer = '';
    var meetOpenBracket = false;
    // meetOpenQuote = null; // ''' or """
    for (var i = 0; i < eventSeries.length; i++) {
      if (eventSeries[i] === '(') {
        if (buffer) tokens.push({ type: T_STRING, value: buffer });
        buffer = '';
        tokens.push({ type: T_OPEN_BRACKET });
        meetOpenBracket = true;
        continue;
      }
      else if (meetOpenBracket && eventSeries[i] === ')') {
        if (buffer) tokens.push({ type: T_STRING, value: buffer });
        buffer = '';
        tokens.push({ type: T_CLOSE_BRACKET });
        meetOpenBracket = false;
        continue;
      } else if (eventSeries[i] === separator) {
        if (buffer) tokens.push({ type: T_STRING, value: buffer });
        buffer = '';
        tokens.push({ type: T_SEPARATOR });
        continue;
      }
      buffer += eventSeries[i];
    }
    if (buffer) tokens.push({ type: T_STRING, value: buffer });

    // parse
    // eventSeries = T_STRING(eventName) T_OPEN_BRACKET [ T_STRING(target) ] T_CLOSE_BRACKET [ T_SEPARATOR eventSeries ] ...
    // TODO nokeydown 같은 옵션은 어쩔 건지 생각하기
    function getEvent(tokens) {
      if (tokens.length === 0 || tokens[0].type !== T_STRING) {
        throw new Error(`Unable to parse "${eventSeries}"`);
      }
      const eventName = tokens.shift().value;
      const ev = { name: eventName };
      if (tokens.length === 0 || tokens[0].type !== T_OPEN_BRACKET) {
        console.log(tokens);
        throw new Error(`Unable to parse "${eventSeries}"`);
      }
      tokens.shift();

      if (tokens.length === 0 || tokens[0].type === T_STRING) {
        var target = tokens.shift().value;
        ev.target = target;
      }

      if (tokens.length === 0 || tokens[0].type !== T_CLOSE_BRACKET) {
        throw new Error(`Unable to parse "${eventSeries}"`);
      }
      tokens.shift();

      return ev;
    }
    function getEvents(tokens) {
      const events = [getEvent(tokens)];
      while (tokens.length > 0) {
        if (tokens[0].type !== T_SEPARATOR) {
          throw new Error(`Unable to parse "${eventSeries}"`);
        }
        tokens.shift();
        events.push(getEvent(tokens));
      }
      return events;
    }
    const events = getEvents(tokens);

    // semantic check
    const keyboardEventType = [
      'keydown', 'keyup'
    ];
    const mouseEventType = [
      'click', 'drag', 'drop', 'move'
    ];
    const supportedEventType = [
      ...keyboardEventType,
      ...mouseEventType
    ];
    for (const ev of events) {
      if (!supportedEventType.includes(ev.name)) {
        throw new Error(`Not supported event name "${ev.name}"`);
      }
      if (mouseEventType.includes(ev.name)) {
        // target should be valid selector
      }
    }
    // TODO 여기서 뭐 드랍이랑 동시에 키업 같은 거 놓으면 때찌한다 같은 것도 넣기
    // 정확히는
    // 마우스 이벤트는 하나만 있어야 함

    this.eventSeriesCache[eventSeries] = events;
    return events;
  }
}
