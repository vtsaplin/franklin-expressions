const DEFAULT_REGEX = /{{\s*(\w+)\s*(?:,\s*([^}]+))?}}/g;

const expressions = new Map();

let regex = DEFAULT_REGEX;

function getTextNodes(root) {
  const all = [];
  for (let node = root.firstChild; node; node = node.nextSibling) {
    if (node.nodeType === Node.TEXT_NODE) all.push(node);
    else all.push(...getTextNodes(node));
  }
  return all;
}

/**
 * Sets the current expression regex
 * @param newRegex
 */
export function setExpressionRegex(newRegex) {
  regex = newRegex;
}

/**
 * Creates an expression
 * The renderer may return a valid HTMLElement, a string or undefined.
 * In the latter case, nothing will be rendered.
 * @param name The name of the expression
 * @param renderer The renderer function
 */
export function createExpression(name, renderer) {
  expressions.set(name.toLowerCase(), renderer);
}

/**
 * Renders expressions
 * @param root The root element to search for expressions
 * @param context The data to pass to the renderer
 */
export function renderExpressions(root = document.body, context = undefined) {
  getTextNodes(root).forEach((textNode) => {
    const text = textNode.textContent;
    const matches = text.matchAll(regex);

    if (matches) {
      const parent = textNode.parentNode;
      textNode.remove();

      let lastIndex = 0;

      Array.from(matches).forEach((match) => {
        const segmentBeforeMatch = text.slice(lastIndex, match.index);
        if (segmentBeforeMatch) {
          parent.append(document.createTextNode(segmentBeforeMatch));
        }

        const [name, args] = match.slice(1);
        const renderer = expressions.get(name.trim().toLowerCase());

        if (renderer) {
          const result = renderer({
            name,
            parent,
            root,
            context,
            args: args?.trim(),
          });

          if (result instanceof HTMLElement) {
            result.classList.add(name);
            parent.append(result);
          } else if (typeof result === 'string') {
            parent.append(document.createTextNode(result));
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn(`expression ${name} not found`);
        }

        lastIndex = match.index + match[0].length;
      });

      if (lastIndex < text.length) {
        parent.append(document.createTextNode(text.slice(lastIndex)));
      }
    }
  });
}
