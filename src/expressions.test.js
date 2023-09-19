import {
  createExpression,
  renderExpressions,
  setExpressionRegex,
} from './expressions.js';

function fromHtml(html) {
  return document.createRange().createContextualFragment(html).firstChild;
}

describe('renderPlaceholders', () => {
  test('renders placeholders with no arguments', () => {
    createExpression('p1', () => fromHtml('<span>text</span>'));
    const root = fromHtml('<div>text1 {{p1}} text2</div>');
    renderExpressions(root);
    expect(root.innerHTML).toBe('text1 <span class="placeholder p1">text</span> text2');
  });

  test('renders placeholders with arguments', () => {
    createExpression('p1', ({ args }) => fromHtml(`<span>${args}</span>`));
    const root = fromHtml('<div>text1 {{p1, arg1, arg2}} text2</div>');
    renderExpressions(root);
    expect(root.innerHTML).toBe('text1 <span class="placeholder p1">arg1, arg2</span> text2');
  });

  test('renders multiple placeholders in a single text node', () => {
    createExpression('p1', () => fromHtml('<span>1</span>'));
    createExpression('p2', () => fromHtml('<span>2</span>'));
    const root = fromHtml('<div>text1 {{p1}} text {{p2}} text2</div>');
    renderExpressions(root);
    expect(root.innerHTML).toBe('text1 <span class="placeholder p1">1</span> text <span class="placeholder p2">2</span> text2');
  });

  test('renders placeholders as text', () => {
    createExpression('p1', () => 'text');
    const root = fromHtml('<div>text1 {{p1}} text2</div>');
    renderExpressions(root);
    expect(root.innerHTML).toBe('text1 text text2');
  });

  test('ignores missing placeholders', () => {
    const root = fromHtml('<div>text1 {{missing}} text2</div>');
    renderExpressions(root);
    expect(root.innerHTML).toBe('text1  text2');
  });

  test('injects root node', () => {
    createExpression('p1', ({ root, args }) => {
      root.style.color = args;
    });
    const root = fromHtml('<div>text1 {{p1, red}} text2</div>');
    renderExpressions(root);
    expect(root.outerHTML).toBe('<div style="color: red;">text1  text2</div>');
  });

  test('injects parent node', () => {
    createExpression('p1', ({ parent, args }) => {
      parent.style.color = args;
    });
    const root = fromHtml('<div><div>text1 {{p1, green}} text2</div></div>');
    renderExpressions(root);
    expect(root.outerHTML).toBe('<div><div style="color: green;">text1  text2</div></div>');
  });

  test('injects context', () => {
    createExpression('p1', ({ context }) => context);
    const root = fromHtml('<div>text1 {{p1}} text2</div>');
    renderExpressions(root, 'text');
    expect(root.outerHTML).toBe('<div>text1 text text2</div>');
  });

  test('uses custom regex', () => {
    const fn = jest.fn();
    createExpression('p1', fn);
    createExpression('p2', fn);
    const root = fromHtml('<div>text1 @@p1(arg1, arg2) test2 @@p2(arg1) text3</div>');
    setExpressionRegex(/@@(\w+)(?:\(([^)]*)\))?/g);
    renderExpressions(root);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, expect.objectContaining({ args: 'arg1, arg2' }));
    expect(fn).toHaveBeenNthCalledWith(2, expect.objectContaining({ args: 'arg1' }));
  });
});
