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
  mousemoved = false;

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
    this.mousemoved = true;
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
    this.mousemoved = false;
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
  get isMousemoved() {
    return this.mousemoved;
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
    return !!this.reverseFind(s => s.name === 'keydown' && (strictly ? (s.key === key && s.code === code) : (s.key === key || s.code === code)));
  }
  getKeydownEvent(key, code, strictly = false) {
    return this.reverseFind(s => s.name === 'keydown' && (strictly ? (s.key === key && s.code === code) : (s.key === key || s.code === code))) || null;
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

          const events = [];
          // 선행 조건 만족하는지 살펴보기
          // 클릭이면 근데 마우스 다운 이전 걸 봐야하나
          for (var i = eventSeries.length - 2; i >= 0; i--) {
            var condition = eventSeries[i];
            if (condition.name === 'keydown') {
              if (!this.isKeydown(condition.target, condition.target)) {
                continue listener;
              }
              events.push(this.reverseFind(s => s.name === 'keydown' && (s.key === condition.target || s.code === condition.target)));
            }
          }

          emit({
            events: events.concat([this.latestEvent]),
            x: this.mouseX,
            y: this.mouseY,
            target: this.mousedownTarget
          });
          break;
        }
        case 'move': {
          // 움직인다!
          if (this.latestEvent.name !== 'mousemove' || !this.isMousemoved) {
            continue;
          }
          // 뭐 누르고 있으면 드래그임
          if (this.isMousedown) {
            continue;
          }

          // 선행 조건 만족하는지 살펴보기
          // 마우스 이벤트의 선행 조건은 키 다운 뿐 같음
          const events = [];
          for (var i = eventSeries.length - 2; i >= 0; i--) {
            var condition = eventSeries[i];
            if (condition.name === 'keydown') {
              if (!this.isKeydown(condition.target, condition.target)) {
                continue listener;
              }
              events.push(this.reverseFind(s => s.name === 'keydown' && (s.key === condition.target || s.code === condition.target)));
            }
          }

          emit({
            events: events.concat([this.latestEvent]),
            x: this.mouseX,
            y: this.mouseY
          });
          break;
        }
        case 'drag': {
          // 움직인다!
          if (this.latestEvent.name !== 'mousemove' || !this.isMousemoved) {
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
          const events = [];
          var mousedownEventIndex = this.reverseFindIndex(s => s.name === 'mousedown');
          for (var i = eventSeries.length - 2; i >= 0; i--) {
            var condition = eventSeries[i];
            if (condition.name === 'keydown') {
              const keydownEvent = this.getKeydownEvent(condition.target, condition.target);
              if (!keydownEvent || this.eventHistory.indexOf(keydownEvent) > mousedownEventIndex) {
                continue listener;
              }
              events.push(keydownEvent);
            }
          }

          emit({
            events: events.concat([this.reverseFind(s => s.name === 'mousedown'), this.latestEvent]),
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
          const events = [];
          var mousedownEventIndex = this.reverseFindIndex(s => s.name === 'mousedown');
          for (var i = eventSeries.length - 2; i >= 0; i--) {
            var condition = eventSeries[i];
            if (condition.name === 'keydown') {
              const keydownEvent = this.getKeydownEvent(condition.target, condition.target);
              if (!keydownEvent || this.eventHistory.indexOf(keydownEvent) > mousedownEventIndex) {
                continue listener;
              }
              events.push(keydownEvent);
            }
          }

          emit({
            events: events.concat([this.reverseFind(s => s.name === 'mousedown'), this.latestEvent]),
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

          // 선행 조건 만족하는지 살펴보기
          const events = [];
          var currentEventIndex = this.eventHistory.length - 1;
          for (var i = eventSeries.length - 2; i >= 0; i--) {
            var condition = eventSeries[i];
            if (condition.name === 'keydown') {
              const keydownEvent = this.getKeydownEvent(condition.target, condition.target);
              if (!keydownEvent || this.eventHistory.indexOf(keydownEvent) > currentEventIndex) {
                continue listener;
              }
              events.push(keydownEvent);
            }
            if (condition.name === 'drag' || condition.name === 'move') {
              if (condition.name === 'drag' && !this.mousedownTarget?.matches(condition.target)) {
                continue listener;
              }
              var mousemoveEvent, mousedownEvent;
              while (currentEventIndex >= 0 && (mousemoveEvent = this.eventHistory[currentEventIndex--]).name !== 'mousemove');
              if (mousemoveEvent?.name !== 'mousemove') {
                continue listener;
              }
              events.push(mousemoveEvent);
              if (condition.name === 'drag') {
                while (currentEventIndex >= 0 && (mousedownEvent = this.eventHistory[currentEventIndex--]).name !== 'mousedown');
                if (mousedownEvent?.name !== 'mousedown') {
                  continue listener;
                }
                events.push(mousedownEvent);
              }
            }
          }

          emit({
            events: events.reverse().concat([this.latestEvent]),
            key: this.latestEvent.raw.key,
            code: this.latestEvent.raw.code
          });
          break;
        }
        case 'keyup': {
          if (this.latestEvent.name !== 'keyup') {
            continue;
          }
          if (lastEvent.target !== this.latestEvent.raw.key &&
              lastEvent.target !== this.latestEvent.raw.code) {
            continue;
          }

          // 선행 조건 만족하는지 살펴보기
          const events = [];
          var currentEventIndex = this.eventHistory.length - 1;
          for (var i = eventSeries.length - 2; i >= 0; i--) {
            var condition = eventSeries[i];
            if (condition.name === 'keydown') {
              const keydownEvent = this.getKeydownEvent(condition.target, condition.target);
              if (!keydownEvent || this.eventHistory.indexOf(keydownEvent) > currentEventIndex) {
                continue listener;
              }
              events.push(keydownEvent);
            }
            if (condition.name === 'drag' || condition.name === 'move') {
              if (condition.name === 'drag' && !this.mousedownTarget?.matches(condition.target)) {
                continue listener;
              }
              var mousemoveEvent, mousedownEvent;
              while (currentEventIndex >= 0 && (mousemoveEvent = this.eventHistory[currentEventIndex--]).name !== 'mousemove');
              if (mousemoveEvent?.name !== 'mousemove') {
                continue listener;
              }
              events.push(mousemoveEvent);
              if (condition.name === 'drag') {
                while (currentEventIndex >= 0 && (mousedownEvent = this.eventHistory[currentEventIndex--]).name !== 'mousedown');
                if (mousedownEvent?.name !== 'mousedown') {
                  continue listener;
                }
                events.push(mousedownEvent);
              }
            }
          }

          emit({
            events: events.reverse().concat([this.latestEvent]),
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

    try {
      const events = this.semanticCheck(this.parse(this.tokenize(eventSeries)));
      this.eventSeriesCache[eventSeries] = events;
      return events;
    } catch (e) {
      console.error(e);
    }
  }

  tokenize(eventSeriesString) {
    // tokenize
    // token type
    // { type: STRING, value: string }
    // { type: open_bracket }
    // { type: close_bracket }
    // { type: separator }
    const separator = '|';

    const tokens = [];
    var buffer = '';
    var meetOpenBracket = false;
    // meetOpenQuote = null; // ''' or """
    for (var i = 0; i < eventSeriesString.length; i++) {
      if (eventSeriesString[i] === '(') {
        if (buffer) tokens.push({ type: EventSequencesParser.T_STRING, value: buffer });
        buffer = '';
        tokens.push({ type: EventSequencesParser.T_OPEN_BRACKET });
        meetOpenBracket = true;
        continue;
      }
      else if (meetOpenBracket && eventSeriesString[i] === ')') {
        if (buffer) tokens.push({ type: EventSequencesParser.T_STRING, value: buffer });
        buffer = '';
        tokens.push({ type: EventSequencesParser.T_CLOSE_BRACKET });
        meetOpenBracket = false;
        continue;
      } else if (eventSeriesString[i] === separator) {
        if (buffer) tokens.push({ type: EventSequencesParser.T_STRING, value: buffer });
        buffer = '';
        tokens.push({ type: EventSequencesParser.T_SEPARATOR });
        continue;
      }
      buffer += eventSeriesString[i];
    }
    if (buffer) tokens.push({ type: EventSequencesParser.T_STRING, value: buffer });

    return tokens;
  }

  parse(tokens) {
    // parse
    // eventSeries = T_STRING(eventName) T_OPEN_BRACKET [ T_STRING(target) ] T_CLOSE_BRACKET [ T_SEPARATOR eventSeries ] ...
    // TODO nokeydown 같은 옵션은 어쩔 건지 생각하기
    function getEvent(tokens) {
      if (tokens.length === 0 || tokens[0].type !== EventSequencesParser.T_STRING) {
        throw new Error(`Unable to parse "${eventSeries}"`);
      }
      const eventName = tokens.shift().value;
      const ev = { name: eventName };
      if (tokens.length === 0 || tokens[0].type !== EventSequencesParser.T_OPEN_BRACKET) {
        console.log(tokens);
        throw new Error(`Unable to parse "${eventSeries}"`);
      }
      tokens.shift();

      if (tokens.length === 0 || tokens[0].type === EventSequencesParser.T_STRING) {
        var target = tokens.shift().value;
        ev.target = target;
      }

      if (tokens.length === 0 || tokens[0].type !== EventSequencesParser.T_CLOSE_BRACKET) {
        throw new Error(`Unable to parse "${eventSeries}"`);
      }
      tokens.shift();

      return ev;
    }
    function getEvents(tokens) {
      const events = [getEvent(tokens)];
      while (tokens.length > 0) {
        if (tokens[0].type !== EventSequencesParser.T_SEPARATOR) {
          throw new Error(`Unable to parse "${eventSeries}"`);
        }
        tokens.shift();
        events.push(getEvent(tokens));
      }
      return events;
    }
    const events = getEvents(tokens);
    return events;
  }

  semanticCheck(events) {
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
    // 마우스 이벤트는 하나만 있어야 함 (커서는 하나니까)
    // keyup, click, drop 은 마지막에만 존재 가능
    return events;
  }
}
/*
EventSequencesParser.T_STRING = 'T_STRING',
EventSequencesParser.T_OPEN_BRACKET = 'T_OPEN_BRACKET',
EventSequencesParser.T_CLOSE_BRACKET = 'T_CLOSE_BRACKET',
EventSequencesParser.T_SEPARATOR = 'T_SEPARATOR';
*/
EventSequencesParser.T_STRING = 1,
EventSequencesParser.T_OPEN_BRACKET = 2,
EventSequencesParser.T_CLOSE_BRACKET = 3,
EventSequencesParser.T_SEPARATOR = 4;
