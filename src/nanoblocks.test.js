import {
  createNanoBlock,
  renderNanoBlocks,
  setNanoBlockRegex,
} from './nanoblocks.js';

function fromHtml(html) {
  return document.createRange().createContextualFragment(html).firstChild;
}

describe('renderNanoBlocks', () => {
  test('renders nanoblocks with no arguments', () => {
    createNanoBlock('nb1', () => fromHtml('<span>text</span>'));
    const root = fromHtml('<div>text1 {{nb1}} text2</div>');
    renderNanoBlocks(root);
    expect(root.innerHTML).toBe('text1 <span class="nano-block nb1">text</span> text2');
  });

  test('renders nanoblocks with arguments', () => {
    createNanoBlock('nb1', ({ args }) => fromHtml(`<span>${args}</span>`));
    const root = fromHtml('<div>text1 {{nb1, arg1, arg2}} text2</div>');
    renderNanoBlocks(root);
    expect(root.innerHTML).toBe('text1 <span class="nano-block nb1">arg1, arg2</span> text2');
  });

  test('renders multiple nanoblocks in a single text node', () => {
    createNanoBlock('nb1', () => fromHtml('<span>1</span>'));
    createNanoBlock('nb2', () => fromHtml('<span>1</span>'));
    const root = fromHtml('<div>text1 {{nb1}} text {{nb2}} text2</div>');
    renderNanoBlocks(root);
    expect(root.innerHTML).toBe('text1 <span class="nano-block nb1">1</span> text <span class="nano-block nb2">1</span> text2');
  });

  test('renders nanoblocks as text', () => {
    createNanoBlock('nb1', () => 'text');
    const root = fromHtml('<div>text1 {{nb1}} text2</div>');
    renderNanoBlocks(root);
    expect(root.innerHTML).toBe('text1 text text2');
  });

  test('ignores missing nanoblocks', () => {
    const root = fromHtml('<div>text1 {{missing}} text2</div>');
    renderNanoBlocks(root);
    expect(root.innerHTML).toBe('text1  text2');
  });

  test('injects root node', () => {
    createNanoBlock('nb1', ({ root, args }) => {
      root.style.color = args;
    });
    const root = fromHtml('<div>text1 {{nb1, red}} text2</div>');
    renderNanoBlocks(root);
    expect(root.outerHTML).toBe('<div style="color: red;">text1  text2</div>');
  });

  test('injects parent node', () => {
    createNanoBlock('nb1', ({ parent, args }) => {
      parent.style.color = args;
    });
    const root = fromHtml('<div><div>text1 {{nb1, green}} text2</div></div>');
    renderNanoBlocks(root);
    expect(root.outerHTML).toBe('<div><div style="color: green;">text1  text2</div></div>');
  });

  test('injects context', () => {
    createNanoBlock('nb1', ({ context }) => context);
    const root = fromHtml('<div>text1 {{nb1}} text2</div>');
    renderNanoBlocks(root, 'text');
    expect(root.outerHTML).toBe('<div>text1 text text2</div>');
  });

  test('uses custom regex', () => {
    const fn = jest.fn();
    createNanoBlock('nb1', fn);
    createNanoBlock('nb2', fn);
    const root = fromHtml('<div>text1 @@nb1(arg1, arg2) test2 @@nb1(arg1) text3</div>');
    setNanoBlockRegex(/@@(\w+)(?:\(([^)]*)\))?/g);
    renderNanoBlocks(root);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, expect.objectContaining({ args: 'arg1, arg2' }));
    expect(fn).toHaveBeenNthCalledWith(2, expect.objectContaining({ args: 'arg1' }));
  });
});
