const nanoblocks = new Map();

const REGEX = /@@(\w+)(?:\(([^)]*)\))?/g;

function getTextNodes(root) {
  const all = [];
  for (let node = root.firstChild; node; node = node.nextSibling) {
    if (node.nodeType === Node.TEXT_NODE) all.push(node);
    else all.push(...getTextNodes(node));
  }
  return all;
}

/**
 * Creates a nano block
 * The renderer may return a valid HTMLElement, a string or undefined.
 * In the latter case, the nano block will not be rendered.
 * @param name The name of the block
 * @param renderer The renderer function
 */
export function createNanoBlock(name, renderer) {
  nanoblocks.set(name.toLowerCase(), renderer);
}

/**
 * Renders nano blocks
 * @param root The root element to search for nano blocks
 * @param context The data to pass to the renderer
 */
export function renderNanoBlocks(root = document.body, context = undefined) {
  getTextNodes(root).forEach((textNode) => {
    const text = textNode.textContent;
    const matches = text.matchAll(REGEX);

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
        const renderer = nanoblocks.get(name.toLowerCase());

        if (renderer) {
          const result = renderer({
            parent,
            root,
            context,
            args,
          });

          if (result instanceof HTMLElement) {
            result.classList.add('nano-block', name);
            parent.append(result);
          } else if (typeof result === 'string') {
            parent.append(document.createTextNode(result));
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn(`nano block ${name} not found`);
        }

        lastIndex = match.index + match[0].length;
      });

      if (lastIndex < text.length) {
        parent.append(document.createTextNode(text.slice(lastIndex)));
      }
    }
  });
}
