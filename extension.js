/**
 * VSCode import
 * @type any
 */
const vscode = require("vscode");

/**
 * List of supported language IDs that the extension renders in
 * This is part of the script to prevent hightlighting for stuff like TS types, eg: "const stuff: <CustomType>"
 * @type {[string]}
 */
const supportedLanguages = [
  "html",
  "php",
  "twig",
  "blade",
  "smarty",
  "xml"
]

/**
 * User set global application
 * Can instead inherit the default values if user sets nothing
 * @type {boolean}
 */
const allowEverywhere = vscode.workspace
  .getConfiguration("rainbowTags")
  .get("allowEverywhere")


/**
 * User set color array thought the options
 * Can instead inherit the default values if user sets nothing
 * @type {[string]}
 */
const tagColorList = vscode.workspace
  .getConfiguration("rainbowTags")
  .get("colors");

/**
 * User set style choice for highlighting
 * Can instead inherit the default value if user sets nothing
 * @type {[string]
 */
  const colorStyle = vscode.workspace
    .getConfiguration("rainbowTags")
    .get("hightlightType");

/**
 * Wrongly placed/incomplete bracket coloring
 * @type {string}
 */
const isolatedRightBracketsDecorationTypes = vscode.window.createTextEditorDecorationType(
  {
    color: "#e2041b"
  }
);

/**
 * List of color text decorators that 
 * @type {[{key: string}]} - A list of VScode's "TextEditorDecorationType" values ending with a number based on auto-generation
 */
const tagDecoratorList = [];

/**
 * Activates the extension by creating new editor decoration types to use inside the HTML tags
 * @param {any} context - Context of the VScode editor
 */
function activate(context) {

  // Registers the actual extension command inside VScode
  const registerExtensionCommand = vscode.commands.registerCommand(
    "extension.rainbowTags",
    () => {
      rainbowTags(vscode.window.activeTextEditor);
    }
  );
  context.subscriptions.push(registerExtensionCommand);

  // Assigns all colors to the decorator list
  for (let colorIndex in tagColorList) {

    let stylePair

     switch (colorStyle) {
             
        case 'background-color':
          stylePair = {
            backgroundColor: tagColorList[colorIndex]
          }          
          break;      

        case 'border':
          stylePair = {
            border: "1px solid "+ tagColorList[colorIndex]
          }          
          break;
      
        default:
          stylePair = {
            color: tagColorList[colorIndex]
          }
          break;
      }

    tagDecoratorList.push(       
      vscode.window.createTextEditorDecorationType(stylePair)

    );
  }
  
  // Run once on load if an editor is opened
  rainbowTags(vscode.window.activeTextEditor);
   
  // Trigger the extension's action on opening of a new editor
  vscode.workspace.onDidOpenTextDocument(
    editor => {
      rainbowTags(editor);
    },
    null,
    context.subscriptions
  );

  // Trigger the extension's action on swapping between editors
  vscode.window.onDidChangeActiveTextEditor(

    editor => {
      rainbowTags(editor);
    },
    null,
    context.subscriptions
  );

  // Trigger the extension's action on changing of active editor's text
  vscode.window.onDidChangeActiveTextEditor(
    editor => {
      rainbowTags(editor);
    },
    null,
    context.subscriptions
  );

  // Trigger the extension's action on changing of active editor's text (dirty edits)
  vscode.workspace.onDidChangeTextDocument(
    function(event) {
      let activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && event.document === activeEditor.document) {
        rainbowTags(activeEditor);
      }
    },
    null,
    context.subscriptions
  );
  
}

/**
 * Does the actual coloring of tags
 * @param {any} activeEditor - The current editor opened in VSCode
 */
function rainbowTags(activeEditor) {
  
  // Instantly kill this if no editor is provided
  if (!activeEditor) {
    return;
  }

  // Instantly kill this if the language is wrong
  if (!supportedLanguages.includes(activeEditor.document.languageId) && allowEverywhere === false) {
    return;
  }
  

  /*********************************************/
  /*----------DECLARATIONS: VARIABLES----------*/
  /*********************************************/

  /**
   * Text content of the current editor
   * @type {string}
   */
  let text = activeEditor.document.getText();

  /**
   * List of empty arrays, ready to be populated later
   * @type {[[]]}
   */
  let divsDecorationTypeMap = []


  /*********************************************/
  /*----------DECLARATIONS: FUNCTIONS----------*/
  /*********************************************/


  /**
   * Removes all HTML comments from the string
   * @param {string} inputString 
   * @return {string} String without HTML comments
   */
  const commentRemover = (inputString) => {

  /**
   * Temporary text file to store the matches found for the closing tags via RegEx
   * @type {string}
   */
  let matchComment;

  /**
   * RegEx to find all the comments
   * @type {RegExp}
   */
  const regExComments = /<!--([\s\S])*?-->/gm;  

    while (matchComment = regExComments.exec(inputString)) {
      let matchLen = matchComment[0].length;
      let repl = " ".repeat(matchLen);

      // Replaces comment with spaces
      inputString = inputString.substring(0, matchComment.index) + repl + inputString.substring(matchComment.index + matchLen);  
    }  
    return inputString  
  }

  /**
   * Maps currently active decorator list generated from the config file for the color array
   * @param {[{key: string}]} decoratorList
   * @return {[[]]} Returns an array of empty arrays, ready to be populated later
   */
  const mapDecoratorTypes = (decoratorList) => {
    const returnArray = []
    decoratorList.forEach((_,index) => {
      return returnArray[index] = []
    })
    return returnArray
  }

  /**
   * Assign the color tags from a text string
   * @param {string} inputText 
   */
  const assignTagColors = (inputText) => {

    /**
     * Regex pattern for tag pairs
     * @type {RegExp}
     */ 
    const regExTags = /(<\/?(?!html|head|meta|body|title|link|script|base|style)[a-z](?:[^>]*)?>)/g;

    /* ------ TEMP DUMPS ----- */

    /**
    * Temporary text file to store the matches found for the opening tags via RegEx
    * @type {string}
    */
    let matchTags;

    /**
     * Temporary dump for all opened divs
     * @type {[number]}
     */
    const openDivStack = [];

    /**
     * Temporary dump for all of the closing brackets
     * @type {[number]}
     */
    const rightBracketsDecorationTypes = [];

    /**
     * Temporary counter for the div matching cycles
     * @type {number}
     */
    let roundCalculate;
    
    /**
     * Counter for currently used colors from the color array provided via config or default
     * @type {number}
     */
    let divsColorCount = 0;


    /* ------ Actual script ----- */

    // Process all tags
    while ((matchTags = regExTags.exec(inputText))) { 
  
      // Closing of a tag pair
      if(matchTags[0].substring(0, 2) === "</") {
  
        let startPosEnding = activeEditor.document.positionAt(matchTags.index);
        let endPosEnding = activeEditor.document.positionAt(matchTags.index + matchTags[0].indexOf(">")+1)  
        let decorationEnding = {
          range: new vscode.Range(startPosEnding, endPosEnding),
          hoverMessage: null
        };
        if (openDivStack.length > 0) {

          roundCalculate = openDivStack.pop();
          divsColorCount = roundCalculate;
          divsDecorationTypeMap[roundCalculate].push(decorationEnding);
        } else {            
          rightBracketsDecorationTypes.push(decorationEnding);
        }
      }

      // Opening of a tag pair
      else if(matchTags[0].substring(0, 1) === "<") {

        let startPosOpening = activeEditor.document.positionAt(matchTags.index);

        let endPosOpening

        // If there is a whitespace in tag, indicating that there are attributes in it        
        if(matchTags[0].indexOf(" ") !== -1){ 
          endPosOpening = activeEditor.document.positionAt(matchTags.index + matchTags[0].indexOf(" "))          
        }
        // If string has no whitespaces, indicating it is without attributes
        else{
          endPosOpening = activeEditor.document.positionAt(matchTags.index + matchTags[0].indexOf(">"))   
        }
          
        let closeTagStartPos = activeEditor.document.positionAt(
          regExTags.lastIndex - 1
        );
        let closeTagEndPos = activeEditor.document.positionAt(regExTags.lastIndex);
        let decorationOpening = {
          range: new vscode.Range(startPosOpening, endPosOpening),
          hoverMessage: null
        };
        let closeTagDecoration = {
          range: new vscode.Range(closeTagStartPos, closeTagEndPos),
          hoverMessage: null
        };
        roundCalculate = divsColorCount;
        openDivStack.push(roundCalculate);
        divsColorCount++;
        if (divsColorCount >= tagColorList.length) {
          divsColorCount = 0;
        }
        divsDecorationTypeMap[roundCalculate].push(decorationOpening);
        divsDecorationTypeMap[roundCalculate].push(closeTagDecoration);
      }       
       
      }
  
    // Set the decorators for all proper tags
    for (let tagDecorator in tagDecoratorList) {
      activeEditor.setDecorations(
        tagDecoratorList[tagDecorator],
        divsDecorationTypeMap[tagDecorator]
      );
    }
  
    // Set decorator for all closing and all incomplete, faulty tags
    activeEditor.setDecorations(
      isolatedRightBracketsDecorationTypes,
      rightBracketsDecorationTypes
    );
  }


  /****************************/
  /*----------SCRIPT----------*/
  /****************************/


  // Remove comments from the script
  text = commentRemover(text)

  // Assign decorator types
  divsDecorationTypeMap = mapDecoratorTypes(tagDecoratorList)

  // Process the document string
  assignTagColors(text)

}

/**
 * Decactivates the extension
 */
function deactivate() {}

/**
 * Exports
 */
module.exports = {
  activate: activate,
  deactivate: deactivate
};
