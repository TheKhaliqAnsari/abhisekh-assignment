import React, { useEffect, useState } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  Modifier,
  convertToRaw,
  convertFromRaw,
} from "draft-js";
import "draft-js/dist/Draft.css";

// Define custom styles
const styleMap = {
  RED: {
    color: "red",
  },
  BOLD: {
    fontWeight: "bold",
  },
  UNDERLINE: {
    textDecoration: "underline",
  },
};

function EditorComponent() {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  useEffect(() => {
    const storedState = localStorage.getItem("editorState");
    if (storedState) {
      setEditorState(
        EditorState.createWithContent(convertFromRaw(JSON.parse(storedState)))
      );
    }
  }, []);

  const handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  const handleBeforeInput = (chars) => {
    if (chars !== " ") {
      return "not-handled";
    }

    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      return "not-handled";
    }

    const currentContent = editorState.getCurrentContent();
    const startKey = selection.getStartKey();
    const currentBlock = currentContent.getBlockForKey(startKey);
    const startOffset = selection.getStartOffset();
    const blockText = currentBlock.getText().slice(0, startOffset);

    if (
      blockText === "#" ||
      blockText === "*" ||
      blockText === "**" ||
      blockText === "***"
    ) {
      const blockLength = blockText.length;
      const newContentState = Modifier.replaceText(
        currentContent,
        selection.merge({
          anchorOffset: startOffset - blockLength,
          focusOffset: startOffset,
        }),
        ""
      );

      let newEditorState = EditorState.push(
        editorState,
        newContentState,
        "change-inline-style"
      );

      if (blockText === "#") {
        newEditorState = RichUtils.toggleBlockType(
          newEditorState,
          "header-one"
        );
      } else {
        const inlineStyle =
          blockText === "*"
            ? "BOLD"
            : blockText === "**"
            ? "RED"
            : blockText === "***"
            ? "UNDERLINE"
            : null;
        if (inlineStyle) {
          newEditorState = RichUtils.toggleInlineStyle(
            newEditorState,
            inlineStyle
          );
        }
      }

      setEditorState(newEditorState);
      return "handled";
    }

    return "not-handled";
  };

  const saveContent = () => {
    const content = editorState.getCurrentContent();
    localStorage.setItem("editorState", JSON.stringify(convertToRaw(content)));
  };

  return (
    <>
      <div>
        <button onClick={saveContent}>Save</button>
      </div>
      <div className="editor-container">
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          handleKeyCommand={handleKeyCommand}
          handleBeforeInput={handleBeforeInput}
          customStyleMap={styleMap}
        />
      </div>
    </>
  );
}

export default EditorComponent;
