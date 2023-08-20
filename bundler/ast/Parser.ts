import { Token, TokenType } from "./Tokenizer"
import { BlockStatement, Expression, FunctionExpression, Identifier, NodeType, Program, Statement, VariableDeclaration, VariableDeclarator, VariableKind } from "./node-Types"



export class Parser {
  private _tokens: Token[]
  private _currentTokenIndex: number = 0
  constructor(tokens: Token[]) {
    this._tokens = tokens
  }

  parse(): Program {
    const program = this._parseProgram()
    return program
  }

  private _parseProgram(): Program {
    const program: Program = {
      type: NodeType.Program,
      body: [],
      start: 0,
      end: Infinity
    }
    // 解析 token 数组
    while (!this._isEnd()) {
      const node = this._parseStatement()
      program.body.push(node)
      if (this._isEnd()) {
        program.end = node.end
      }
    }
    return program
  }

  private _isEnd(): boolean {
    return this._currentTokenIndex >= this._tokens.length
  }
  private _goNext(type: TokenType | TokenType[]): Token {
    if (this._checkCurrentToken(type)) {
      this._currentTokenIndex++
      return this._getCurrentToken()
    } else {
      throw new Error(`expected ${type} but got ${this._getCurrentToken().type}`)
    }
    
  }

  private _parseStatement(): Statement {
    if (this._checkCurrentToken(TokenType.Let)) {
      return this._parseVariableDeclaration()
    }
    throw new Error(`unexpected token ${this._getCurrentToken().type}`)
  }

  private _checkCurrentToken(type: TokenType | TokenType[]): boolean {
    if (this._isEnd()) {
      return false
    }
    const currentToken = this._getCurrentToken()
    if (Array.isArray(type)) {
      return type.includes(currentToken.type)
    }
    else {
      return currentToken.type === type
    }
  }

  private _getCurrentToken(): Token {
    return this._tokens[this._currentTokenIndex]
  }

  private _getPreviousToken(): Token {
    return this._tokens[this._currentTokenIndex - 1]
  }

  private _parseIdentifier(): Identifier {
    const token = this._getCurrentToken()
    const Identifier: Identifier = {
      type: NodeType.Identifier,
      name: token.value!,
      start: token.start,
      end: token.end
    }
    this._goNext(TokenType.Identifier)
    return Identifier
  }

  private _parseFunctionExpression(): FunctionExpression {
    const { start } = this._getCurrentToken()
    this._goNext(TokenType.Function)
    let id = null
    if (this._checkCurrentToken(TokenType.Identifier)) {
      id = this._parseIdentifier()
    }
    const params = this._parseParams()
    const body = this._praseBlockStatement()
    const node: FunctionExpression = {
      type: NodeType.FunctionExpression,
      id,
      params,
      body,
      start,
      end: body.end
    }
    return node
  }
  // 解析函数参数
  private _parseParams(): Identifier[] | Expression[] {
    this._goNext(TokenType.LeftParen)
    const params = []
    while (!this._checkCurrentToken(TokenType.RightParen)) {
      let param = this._parseIdentifier()
      params.push(param)
    }
    this._goNext(TokenType.RightParen)
    return params
  }
  // 解析函数体
  private  _praseBlockStatement(): BlockStatement {
    const { start } = this._getCurrentToken()
    const blockStatement: BlockStatement = {
      type: NodeType.BlockStatement,
      body: [],
      start,
      end: Infinity
    }
    this._goNext(TokenType.LeftCurly)
    while (!this._checkCurrentToken(TokenType.RightCurly)) {
      const node = this._parseStatement()
      blockStatement.body.push(node)
    }
    this._goNext(TokenType.RightCurly)
    blockStatement.end = this._getPreviousToken().end
    return blockStatement
  }

  private _parseVariableDeclaration(): VariableDeclaration {
    const { start } = this._getCurrentToken()
    const kind = this._getCurrentToken().value
    // if (kind === 'let') {
      this._goNext(TokenType.Let)
      // 解析变量名
      const id = this._parseIdentifier()
      // 解析等号=
      this._goNext(TokenType.Assign)
      // 解析函数表达式
      const init = this._parseFunctionExpression()
      const declarator: VariableDeclarator = {
        type: NodeType.VariableDeclarator,
        id,
        init,
        start: id.start,
        end: init ? init.end : id.end
      }
      const node: VariableDeclaration = {
        type: NodeType.VariableDeclaration,
        kind: kind as VariableKind,
        declarations: [declarator],
        start,
        end: this._getPreviousToken().end
      }
      return node
    // }
  }
}

