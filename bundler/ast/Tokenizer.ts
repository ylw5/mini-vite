export enum TokenType {
  // let
  Let = 'Let',
  // =
  Assign = 'Assign',
  // function
  Function = 'Function',
  // 变量名
  Identifier = 'Identifier',
  // (
  LeftParen = 'LeftParen',
  // )
  RightParen = 'RightParen',
  // {
  LeftCurly = 'LeftCurly',
  // }
  RightCurly = 'RightCurly',
}

export type Token = {
  type: TokenType
  value?: string
  start: number 
  end: number
  raw?: string
}

const TOKENS_GENERATOR: Record<string, (...args: any[]) => Token> = {
  let(start: number) {
    return {
      type: TokenType.Let,
      start,
      end: start + 3,
      value: 'let'
    }
  },
  assign(start: number) {
    return {
      type: TokenType.Assign,
      start,
      end: start + 1,
      value: '='
    }
  },
  function(start: number) {
    return {
      type: TokenType.Function,
      start,
      end: start + 8,
      value: 'function'
    }
  },
  leftParen(start: number) {
    return {
      type: TokenType.LeftParen,
      start,
      end: start + 1,
      value: '('
    }
  },
  rightParen(start: number) {
    return {
      type: TokenType.RightParen,
      start,
      end: start + 1,
      value: ')'
    }
  },
  leftCurly(start: number) {
    return {
      type: TokenType.LeftCurly,
      start,
      end: start + 1,
      value: '{'
    }
  },
  rightCurly(start: number) {
    return {
      type: TokenType.RightCurly,
      start,
      end: start + 1,
      value: '}'
    }
  },
  identifier(start: number, value: string) {
    return {
      type: TokenType.Identifier,
      start,
      end: start + value.length,
      value
    }
  }
}

type SingleCharToken = '=' | '(' | ')' | '{' | '}'

const KNOWN_SINGLE_CHAR_TOKENS = new Map<
  SingleCharToken,
  typeof TOKENS_GENERATOR[SingleCharToken]
>([
  ['=', TOKENS_GENERATOR.assign],
  ['(', TOKENS_GENERATOR.leftParen],
  [')', TOKENS_GENERATOR.rightParen],
  ['{', TOKENS_GENERATOR.leftCurly],
  ['}', TOKENS_GENERATOR.rightCurly],
])

export class Tokenizer {
  private _tokens: Token[] = []
  private _currentIndex: number = 0
  private _source : string
  constructor(input: string) {
    this._source = input
  }
  tokenize(): Token[] {
    while(this._currentIndex < this._source.length) {
      let currentChar = this._source[this._currentIndex]
      const startIndex = this._currentIndex
      // 处理空格
      if (currentChar === ' ') {
        this._currentIndex++
        continue
      }
      // 处理字母
      else if(isAlpha(currentChar)) {
        let identifier = ''
        while(isAlpha(currentChar)) {
          identifier += currentChar
          currentChar = this._source[++this._currentIndex]
        }
        let token: Token
        if(identifier in TOKENS_GENERATOR) {
          // 是关键字
          token = TOKENS_GENERATOR[identifier](startIndex)
        } else {
          // 普通变量
          token = TOKENS_GENERATOR.identifier(startIndex, identifier) 
        }
        this._tokens.push(token)
        continue
      }
      // 处理单字符token
      else if(KNOWN_SINGLE_CHAR_TOKENS.has(currentChar as SingleCharToken)) {
        const tokenGenerator = KNOWN_SINGLE_CHAR_TOKENS.get(currentChar as SingleCharToken)!
        this._tokens.push(tokenGenerator(startIndex))
        this._currentIndex++
        continue
      }
    }
    return this._tokens
  }
}

function isAlpha(char: string): boolean {
  return /[a-zA-Z]/.test(char)
}