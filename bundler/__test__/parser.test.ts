import { describe, expect, test } from 'vitest'
import { Tokenizer } from '../ast/Tokenizer';
import { Parser } from '../ast/Parser';
describe("testParserFunction", () => {
  test("test example code", () => {
    const result = {
      type: "Program",
      body: [
        {
          type: "VariableDeclaration",
          kind: "let",
          start: 0,
          end: 23,
          declarations: [
            {
              type: "VariableDeclarator",
              id: {
                type: "Identifier",
                name: "foo",
                start: 4,
                end: 7,
              },
              init: {
                type: "FunctionExpression",
                id: null,
                params: [],
                body: {
                  type: "BlockStatement",
                  body: [],
                  start: 21,
                  end: 23,
                },
                start: 10,
                end: 23,
              },
              start: 4,
              end: 23,
            },
          ]
        },
      ],
      start: 0,
      end: 23,
    };
    const code = `let foo = function() {}`;
    const tokenizer = new Tokenizer(code);
    const parser = new Parser(tokenizer.tokenize());
    expect(parser.parse()).toEqual(result);
  });
});
