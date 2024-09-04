import React from "react";
import styled from "styled-components";

const KeyboardWrapper = styled.div`
  width: auto; // Change from 900px to auto
  display: inline-grid; // Change from grid to inline-grid
  padding: 10px;
  border-radius: 10px;
  grid-gap: 5px;
  grid-template-columns: repeat(20, min(4vw, 4vh));
  grid-template-rows: repeat(6, min(4vw, 4vh));
  margin: 0 auto;
`;

const Key = styled.div`
  color: #fff;
  border-radius: 5px;
  grid-column: span 2;
  grid-row: span 2;
  text-align: left;
  padding-left: 5px;
  position: relative;
  align-items: start;
  flex-direction: column;
  justify-content: space-between;

  &.keyPress {
    border: 1px solid #eeeeee;
  }

  &.upperKey {
    padding-top: 0;
    grid-row: span 1;
  }

  &.backspace {
    grid-column: span 4;
  }

  &.tab {
    grid-column: span 3;
  }

  &.backslash {
    grid-column: span 3;
  }

  &.capslock {
    grid-column: span 4;
  }

  &.enter {
    grid-column: span 4;
  }

  &.leftshift {
    grid-column: span 5;
  }

  &.rightshift {
    grid-column: span 5;
  }

  &.ControlLeft {
    grid-column: span 3;
  }

  &.ControlRight {
    grid-column: span 2;
  }

  &.space {
    grid-column: span 12;
  }

  &.downKey {
    grid-row: 11/12;
    grid-column: 26/29;
    padding-top: 0px;
  }

  &.upKey {
    grid-row: 10/11;
    grid-column: 26/29;
    padding-top: 0px;
  }
`;

const Keyboard = ({ onClick, selected, existing, invalid, images }) => {
  const keys = [
    { id: "Escape", label: "Esc", className: "upperKey hidden" },
    { id: "F1", label: "F1", className: "upperKey hidden" },
    { id: "F2", label: "F2", className: "upperKey hidden" },
    { id: "F3", label: "F3", className: "upperKey hidden" },
    { id: "F4", label: "F4", className: "upperKey hidden" },
    { id: "F5", label: "F5", className: "upperKey hidden" },
    { id: "F6", label: "F6", className: "upperKey hidden" },
    { id: "F7", label: "F7", className: "upperKey hidden" },
    { id: "F8", label: "F8", className: "upperKey hidden" },
    { id: "F9", label: "F9", className: "upperKey hidden" },
    { id: "F10", label: "F10", className: "upperKey hidden" },
    { id: "F11", label: "F11", className: "upperKey hidden" },
    { id: "F12", label: "F12", className: "upperKey hidden" },
    { id: "Insert", label: "Insert", className: "upperKey hidden" },
    { id: "Delete", label: "Del", className: "upperKey hidden" },
    { id: "Backquote", label: "`", className: "hidden" },
    { id: "Digit1", label: "1", className: "hidden" },
    { id: "Digit2", label: "2", className: "hidden" },
    { id: "Digit3", label: "3", className: "hidden" },
    { id: "Digit4", label: "4", className: "hidden" },
    { id: "Digit5", label: "5", className: "hidden" },
    { id: "Digit6", label: "6", className: "hidden" },
    { id: "Digit7", label: "7", className: "hidden" },
    { id: "Digit8", label: "8", className: "hidden" },
    { id: "Digit9", label: "9", className: "hidden" },
    { id: "Digit0", label: "0", className: "hidden" },
    { id: "Minus", label: "-", className: "hidden" },
    { id: "Equal", label: "=", className: "hidden" },
    {
      id: "Backspace",
      label: "Backspace",
      className: "backspace hidden",
    },
    { id: "Tab", label: "Tab", className: "hidden" },
    { id: "KeyQ", label: "Q" },
    { id: "KeyW", label: "W" },
    { id: "KeyE", label: "E" },
    { id: "KeyR", label: "R" },
    { id: "KeyT", label: "T" },
    { id: "KeyY", label: "Y" },
    { id: "KeyU", label: "U" },
    { id: "KeyI", label: "I" },
    { id: "KeyO", label: "O" },
    { id: "KeyP", label: "P" },
    { id: "BracketLeft", label: "[", className: "hidden" },
    { id: "BracketRight", label: "]", className: "hidden" },
    {
      id: "Backslash",
      label: "\\",
      className: "backslash hidden",
    },
    {
      id: "CapsLock",
      label: "CapsLock",
      className: "capslock hidden",
    },
    {
      id: "phantom1",
      label: "",
      style: { gridColumn: "span 1" },
      className: "opacity-0 cursor-pointer pointer-events-none",
    },
    { id: "KeyA", label: "A" },
    { id: "KeyS", label: "S" },
    { id: "KeyD", label: "D" },
    { id: "KeyF", label: "F" },
    { id: "KeyG", label: "G" },
    { id: "KeyH", label: "H" },
    { id: "KeyJ", label: "J" },
    { id: "KeyK", label: "K" },
    { id: "KeyL", label: "L" },
    { id: "Semicolon", label: ";", className: "hidden" },
    { id: "Quote", label: "'", className: "hidden" },
    { id: "Enter", label: "Enter", className: "enter hidden" },
    {
      id: "ShiftLeft",
      label: "Shift",
      className: "leftshift hidden",
    },
    {
      id: "phantom2",
      label: "",
      style: { gridColumn: "span 1" },
      className: "opacity-0 cursor-pointer pointer-events-none",
    },
    {
      id: "phantom3",
      label: "",
      style: { gridColumn: "span 2" },
      className: "opacity-0 cursor-pointer pointer-events-none",
    },
    { id: "KeyZ", label: "Z" },
    { id: "KeyX", label: "X" },
    { id: "KeyC", label: "C" },
    { id: "KeyV", label: "V" },
    { id: "KeyB", label: "B" },
    { id: "KeyN", label: "N" },
    { id: "KeyM", label: "M" },
    { id: "Comma", label: ",", className: "hidden" },
    { id: "Period", label: ".", className: "hidden" },
    { id: "Slash", label: "/", className: "hidden" },
    {
      id: "ShiftRight",
      label: "Shift",
      className: "rightshift hidden",
    },
    {
      id: "ControlLeft",
      label: "Ctrl",
      className: "ControlLeft hidden",
    },
    { id: "OSLeft", label: "Win", className: "hidden" },
    { id: "AltLeft", label: "Alt", className: "hidden" },
    { id: "Space", label: "Space", className: "space hidden" },
    { id: "AltRight", label: "Alt", className: "hidden" },
    {
      id: "ControlRight",
      label: "Ctrl",
      className: "ControlRight hidden",
    },
    { id: "ArrowLeft", label: "←", className: "leftKey hidden" },
    { id: "ArrowDown", label: "↓", className: "downKey hidden" },
    {
      id: "ArrowRight",
      label: "→",
      className: "rightKey hidden",
    },
    { id: "ArrowUp", label: "↑", className: "upKey hidden" },
  ];

  return (
    <>
      <KeyboardWrapper>
        {keys.map((key) => (
          <Key
            key={key.id}
            id={key.id}
            className={`${key.className} cursor-pointer ${
              key.id === selected
                ? "border-orange-500 border-2"
                : "hover:border hover:border-gray-400 "
            } ${
              invalid.includes(key.id)
                ? "bg-red-800"
                : existing.includes(key.id)
                ? "bg-black"
                : "bg-gray-800"
            } flex items-center`}
            style={key.style}
            onClick={() => onClick(key.label.toUpperCase().charCodeAt(0))}
          >
            {key.label}
            {images && images[key.id] ? (
              <img src={images[key.id]} key={key.id} />
            ) : null}
          </Key>
        ))}
      </KeyboardWrapper>
    </>
  );
};

export default Keyboard;
