/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as child_process from "child_process";
import * as assert from "assert";

import {
	TextDocument, Position, Range, SymbolKind,
} from 'vscode-languageserver';
import { DockerSymbols } from '../src/dockerSymbols';

let uri = "uri://host/Dockerfile.sample";
let symbolsProvider = new DockerSymbols();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function createRange(startLine, startCharacter, endLine, endCharacter): Range {
	return Range.create(Position.create(startLine, startCharacter), Position.create(endLine, endCharacter));
}

describe("Dockerfile document symbols", function () {
	describe("whitespace", function() {
		it("empty file", function () {
			let document = createDocument("");
			let symbols = symbolsProvider.parseSymbolInformation(document, uri);
			assert.equal(symbols.length, 0);
		});
	});

	describe("directives", function() {
		it("escape directive", function () {
			let document = createDocument("#escape=`");
			let symbols = symbolsProvider.parseSymbolInformation(document, uri);
			assert.equal(symbols.length, 1);
			assert.equal(symbols[0].containerName, undefined);
			assert.equal(symbols[0].name, "escape");
			assert.equal(symbols[0].kind, SymbolKind.Property);
			assert.equal(symbols[0].location.uri, uri);
			assert.equal(symbols[0].location.range.start.line, 0);
			assert.equal(symbols[0].location.range.start.character, 1);
			assert.equal(symbols[0].location.range.end.line, 0);
			assert.equal(symbols[0].location.range.end.character, 6);
		});

		it("space", function () {
			let document = createDocument("# escape=`");
			let symbols = symbolsProvider.parseSymbolInformation(document, uri);
			assert.equal(symbols.length, 1);
			assert.equal(symbols[0].containerName, undefined);
			assert.equal(symbols[0].name, "escape");
			assert.equal(symbols[0].kind, SymbolKind.Property);
			assert.equal(symbols[0].location.uri, uri);
			assert.equal(symbols[0].location.range.start.line, 0);
			assert.equal(symbols[0].location.range.start.character, 2);
			assert.equal(symbols[0].location.range.end.line, 0);
			assert.equal(symbols[0].location.range.end.character, 7);

			document = createDocument("#\tescape=`");
			symbols = symbolsProvider.parseSymbolInformation(document, uri);
			assert.equal(symbols.length, 1);
			assert.equal(symbols[0].containerName, undefined);
			assert.equal(symbols[0].name, "escape");
			assert.equal(symbols[0].kind, SymbolKind.Property);
			assert.equal(symbols[0].location.uri, uri);
			assert.equal(symbols[0].location.range.start.line, 0);
			assert.equal(symbols[0].location.range.start.character, 2);
			assert.equal(symbols[0].location.range.end.line, 0);
			assert.equal(symbols[0].location.range.end.character, 7);
		});

		it("leading whitespace", function () {
			let document = createDocument(" #escape=`");
			let symbols = symbolsProvider.parseSymbolInformation(document, uri);
			assert.equal(symbols.length, 1);
			assert.equal(symbols[0].containerName, undefined);
			assert.equal(symbols[0].name, "escape");
			assert.equal(symbols[0].kind, SymbolKind.Property);
			assert.equal(symbols[0].location.uri, uri);
			assert.equal(symbols[0].location.range.start.line, 0);
			assert.equal(symbols[0].location.range.start.character, 2);
			assert.equal(symbols[0].location.range.end.line, 0);
			assert.equal(symbols[0].location.range.end.character, 7);

			document = createDocument("\t#escape=`");
			symbols = symbolsProvider.parseSymbolInformation(document, uri);
			assert.equal(symbols.length, 1);
			assert.equal(symbols[0].containerName, undefined);
			assert.equal(symbols[0].name, "escape");
			assert.equal(symbols[0].kind, SymbolKind.Property);
			assert.equal(symbols[0].location.uri, uri);
			assert.equal(symbols[0].location.range.start.line, 0);
			assert.equal(symbols[0].location.range.start.character, 2);
			assert.equal(symbols[0].location.range.end.line, 0);
			assert.equal(symbols[0].location.range.end.character, 7);

			document = createDocument("\r#escape=`");
			symbols = symbolsProvider.parseSymbolInformation(document, uri);
			assert.equal(symbols.length, 1);
			assert.equal(symbols[0].containerName, undefined);
			assert.equal(symbols[0].name, "escape");
			assert.equal(symbols[0].kind, SymbolKind.Property);
			assert.equal(symbols[0].location.uri, uri);
			assert.equal(symbols[0].location.range.start.line, 1);
			assert.equal(symbols[0].location.range.start.character, 1);
			assert.equal(symbols[0].location.range.end.line, 1);
			assert.equal(symbols[0].location.range.end.character, 6);

			document = createDocument("\n#escape=`");
			symbols = symbolsProvider.parseSymbolInformation(document, uri);
			assert.equal(symbols.length, 1);
			assert.equal(symbols[0].containerName, undefined);
			assert.equal(symbols[0].name, "escape");
			assert.equal(symbols[0].kind, SymbolKind.Property);
			assert.equal(symbols[0].location.uri, uri);
			assert.equal(symbols[0].location.range.start.line, 1);
			assert.equal(symbols[0].location.range.start.character, 1);
			assert.equal(symbols[0].location.range.end.line, 1);
			assert.equal(symbols[0].location.range.end.character, 6);

			document = createDocument("\r\n#escape=`");
			symbols = symbolsProvider.parseSymbolInformation(document, uri);
			assert.equal(symbols.length, 1);
			assert.equal(symbols[0].containerName, undefined);
			assert.equal(symbols[0].name, "escape");
			assert.equal(symbols[0].kind, SymbolKind.Property);
			assert.equal(symbols[0].location.uri, uri);
			assert.equal(symbols[0].location.range.start.line, 1);
			assert.equal(symbols[0].location.range.start.character, 1);
			assert.equal(symbols[0].location.range.end.line, 1);
			assert.equal(symbols[0].location.range.end.character, 6);
		});
	});
});
