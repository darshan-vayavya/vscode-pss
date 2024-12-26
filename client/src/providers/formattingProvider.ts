export function formatDocument(text: string): string {
  // Start by formatting curly braces
  let doc = formatCurlyBraces(text);
  // Then format semicolons
  doc = addNewlinesAfterSemicolons(doc);
  // Format multi-line comments:
  doc = formatMultilineComments(doc);

  // The make it process line by line
  let lines = doc.split('\n');
  const formattedLines: string[] = [];

  let indentLevel = 0;
  let isInBlockComment = false;


  for (let line of lines) {
    line = line.trim();

    // Format specific syntax
    line = formatOperators(line);
    line = formatSingleLineComments(line);

    // Handle closing braces
    if (line.startsWith('}')) {
      indentLevel = Math.max(indentLevel - 1, 0);
    }

    // Check if comment block is encountered
    if (line.startsWith("/*")) {
      isInBlockComment = true;
    }
    if (line.endsWith("*/")) {
      isInBlockComment = false;
      if (!line.startsWith("/*")) {
        line = line.replace(/^(?!.*\/\*).*?\*\/$/, (match) => match.replace(/(\*\/)/, ' $1'));
      }
    }

    // Check if still in comment
    if (isInBlockComment) {
      if (line.startsWith("*")) {
        line = ` ${line}`; // Add an extra space
      }
    }

    // Add indentation
    const indentedLine = `${'    '.repeat(indentLevel)}${line}`;
    formattedLines.push(indentedLine);

    // Handle opening braces
    if (line.endsWith('{')) {
      indentLevel++;
    }

  }

  return formattedLines.join('\n');
}

function formatCurlyBraces(input: string): string {
  // Remove newline before `{` and move it back to the previous line
  input = input.replace(/\n\s*{/g, ' {');

  // Ensure there is exactly 1 space before the opening `{`
  input = input.replace(/\s*{/g, ' {');

  // Ensure there is always a newline after the opening `{`
  input = input.replace(/({)\s*/g, '$1\n');

  // Ensure the closing `}` is on its own line and followed by a newline
  input = input.replace(/\s*}\s*/g, '\n}\n');

  return input.trim();
}

function addNewlinesAfterSemicolons(input: string): string {
  // Add a newline after every `;` if it doesn't already have one
  input = input.replace(/;\s*(?!\n)/g, ';\n');
  return input.trim();
}


function formatMultilineComments(documentText: string): string {
  return documentText.replace(
    /\/\*+(\*?)\s*([\s\S]*?)\*\//g,
    (match, docBlock, commentBody) => {
      // Retain the opening block (`/*` or `/**`)
      const opening = docBlock ? '/**' : '/*';

      // If the comment body is empty or just contains stars, return the comment as is
      if (!commentBody.trim()) {
        return `${opening} */`;
      }

      // Check if it's a single-line comment (start and end on the same line)
      if (!commentBody.includes('\n')) {
        // Trim the body and return it in the same line
        return `${opening} ${commentBody.trim()} */`.replace(/\s+/g, ' ');
      }

      // Otherwise, it's a multi-line comment
      const lines = commentBody.split('\n');

      // Process each line of the comment
      const formattedLines = lines.map((line, index) => {
        const trimmedLine = line.trim();

        // Skip empty or '*' only lines
        if (trimmedLine === '' || trimmedLine === '*') {
          return null;
        }

        // Keep the line as it is, but ensure only one star at the start
        let formattedLine = trimmedLine;

        // If the line doesn't start with a star, add one
        if (!formattedLine.startsWith('*')) {
          formattedLine = `* ${formattedLine}`;
        } else {
          // Otherwise, just ensure a single star at the beginning
          formattedLine = `* ${formattedLine.slice(1).trim()}`;
        }

        return formattedLine;
      });

      // Remove null (empty) lines from the formatted array
      const cleanedLines = formattedLines.filter(line => line !== null);

      // Reassemble the comment with a newline between each line and properly closed
      const closing = '*/';
      const body = cleanedLines.join('\n');
      return `${opening}\n${body}\n${closing}`;
    }
  );
}


function formatOperators(input: string): string {
  return input.replace(/\(([^()]+)\)/g, (match, innerContent) => {
    // Format the content inside the parentheses
    const formattedContent = innerContent.replace(/([^\s])([+\-*/%^=<>!&|])([^\s])/g, '$1 $2 $3');
    return `(${formattedContent})`;
  });
}


function formatSingleLineComments(line: string): string {
  // Ensure single-line comments have a space after the //
  line = line.replace(/\/\/(?! )/, '// ');

  return line;
}