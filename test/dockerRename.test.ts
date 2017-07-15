/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import { TextDocument, Position, TextEdit } from 'vscode-languageserver';
import { DockerRename } from '../src/dockerRename';

let renameSupport = new DockerRename();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function rename(document: TextDocument, line: number, character: number, newName: string): TextEdit[] {
	return renameSupport.rename(document, Position.create(line, character), newName);
}

function assertEdit(edit: TextEdit, newName: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(edit.newText, newName);
	assert.equal(edit.range.start.line, startLine);
	assert.equal(edit.range.start.character, startCharacter);
	assert.equal(edit.range.end.line, endLine);
	assert.equal(edit.range.end.character, endCharacter);
}

describe("Dockerfile Document Rename tests", function() {
	describe("FROM", function() {
		describe("AS name", function() {
			it("no COPY", function() {
				let document = createDocument("FROM node AS bootstrap");
				let edits = rename(document, 0, 17, "renamed");
				assert.equal(1, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
			});

			it("COPY", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor in the FROM
				let edits = rename(document, 0, 17, "renamed");
				assert.equal(2, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
				assertEdit(edits[1], "renamed", 2, 12, 2, 21);

				// cursor in the COPY
				edits = rename(document, 2, 16, "renamed");
				assert.equal(2, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
				assertEdit(edits[1], "renamed", 2, 12, 2, 21);
			});

			it("COPY incomplete", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap");
				// cursor in the FROM
				let edits = rename(document, 0, 17, "renamed");
				assert.equal(2, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
				assertEdit(edits[1], "renamed", 2, 12, 2, 21);

				// cursor in the COPY
				edits = rename(document, 2, 16, "renamed");
				assert.equal(2, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
				assertEdit(edits[1], "renamed", 2, 12, 2, 21);
			});

			it("source mismatch", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap2 /git/bin/app .");
				// cursor in the FROM
				let edits = rename(document, 0, 17, "renamed");
				assert.equal(edits.length, 1);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);

				// cursor in the COPY
				edits = rename(document, 2, 16, "renamed");
				assert.equal(edits.length, 1);
				assertEdit(edits[0], "renamed", 2, 12, 2, 22);

				document = createDocument("FROM node AS bootstrap\nCOPY bootstrap /git/build/");
				// cursor in the FROM
				edits = rename(document, 0, 17, "renamed");
				assert.equal(edits.length, 1);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
			});
		});

		describe("invalid", function() {
			it("position", function() {
				let document = createDocument("FROM node AS bootstrap   \nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor after the AS source image
				let edits = rename(document, 0, 24, "renamed");
				assert.equal(edits.length, 0);
				// cursor after the COPY --from
				edits = rename(document, 2, 22, "renamed");
				assert.equal(edits.length, 0);
			});

			it("COPY bootstrap", function() {
				let document = createDocument("FROM node AS bootstrap\nCOPY bootstrap /git/build/");
				// cursor on COPY bootstrap
				let edits = rename(document, 1, 10, "renamed");
				assert.equal(edits.length, 0);
			});
		});
	});

	function createVariablesTest(testSuiteName: string, instruction: string, delimiter: string) {
		describe(testSuiteName, function() {
			it("referenced variable ${var}", function() {
				let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
				let edits = rename(document, 0, 5, "renamed");
				assert.equal(edits.length, 4);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 13, 1, 16);
				assertEdit(edits[2], "renamed", 2, 7, 2, 10);
				assertEdit(edits[3], "renamed", 3, 10, 3, 13);

				edits = rename(document, 1, 13, "renamed");
				assert.equal(edits.length, 4);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 13, 1, 16);
				assertEdit(edits[2], "renamed", 2, 7, 2, 10);
				assertEdit(edits[3], "renamed", 3, 10, 3, 13);

				edits = rename(document, 2, 7, "renamed");
				assert.equal(edits.length, 4);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 13, 1, 16);
				assertEdit(edits[2], "renamed", 2, 7, 2, 10);
				assertEdit(edits[3], "renamed", 3, 10, 3, 13);

				edits = rename(document, 3, 11, "renamed");
				assert.equal(edits.length, 4);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 13, 1, 16);
				assertEdit(edits[2], "renamed", 2, 7, 2, 10);
				assertEdit(edits[3], "renamed", 3, 10, 3, 13);
			});

			it("referenced variable ${var} no value", function() {
				let document = createDocument(instruction + " var\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
				let edits = rename(document, 0, 5, "renamed");
				assert.equal(edits.length, 4);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 13, 1, 16);
				assertEdit(edits[2], "renamed", 2, 7, 2, 10);
				assertEdit(edits[3], "renamed", 3, 10, 3, 13);

				edits = rename(document, 1, 13, "renamed");
				assert.equal(edits.length, 4);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 13, 1, 16);
				assertEdit(edits[2], "renamed", 2, 7, 2, 10);
				assertEdit(edits[3], "renamed", 3, 10, 3, 13);

				edits = rename(document, 2, 7, "renamed");
				assert.equal(edits.length, 4);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 13, 1, 16);
				assertEdit(edits[2], "renamed", 2, 7, 2, 10);
				assertEdit(edits[3], "renamed", 3, 10, 3, 13);

				edits = rename(document, 3, 11, "renamed");
				assert.equal(edits.length, 4);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 13, 1, 16);
				assertEdit(edits[2], "renamed", 2, 7, 2, 10);
				assertEdit(edits[3], "renamed", 3, 10, 3, 13);
			});

			it("referenced variable $var", function() {
				let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\nRUN echo \"$var\"\nRUN echo '$var'");
				let edits = rename(document, 0, 5, "renamed");
				assert.equal(edits.length, 6);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 12, 1, 15);
				assertEdit(edits[2], "renamed", 2, 6, 2, 9);
				assertEdit(edits[3], "renamed", 3, 9, 3, 12);
				assertEdit(edits[4], "renamed", 4, 11, 4, 14);
				assertEdit(edits[5], "renamed", 5, 11, 5, 14);

				edits = rename(document, 1, 13, "renamed");
				assert.equal(edits.length, 6);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 12, 1, 15);
				assertEdit(edits[2], "renamed", 2, 6, 2, 9);
				assertEdit(edits[3], "renamed", 3, 9, 3, 12);
				assertEdit(edits[4], "renamed", 4, 11, 4, 14);
				assertEdit(edits[5], "renamed", 5, 11, 5, 14);

				edits = rename(document, 2, 7, "renamed");
				assert.equal(edits.length, 6);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 12, 1, 15);
				assertEdit(edits[2], "renamed", 2, 6, 2, 9);
				assertEdit(edits[3], "renamed", 3, 9, 3, 12);
				assertEdit(edits[4], "renamed", 4, 11, 4, 14);
				assertEdit(edits[5], "renamed", 5, 11, 5, 14);

				edits = rename(document, 3, 11, "renamed");
				assert.equal(edits.length, 6);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 12, 1, 15);
				assertEdit(edits[2], "renamed", 2, 6, 2, 9);
				assertEdit(edits[3], "renamed", 3, 9, 3, 12);
				assertEdit(edits[4], "renamed", 4, 11, 4, 14);
				assertEdit(edits[5], "renamed", 5, 11, 5, 14);

				edits = rename(document, 4, 12, "renamed");
				assert.equal(edits.length, 6);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 12, 1, 15);
				assertEdit(edits[2], "renamed", 2, 6, 2, 9);
				assertEdit(edits[3], "renamed", 3, 9, 3, 12);
				assertEdit(edits[4], "renamed", 4, 11, 4, 14);
				assertEdit(edits[5], "renamed", 5, 11, 5, 14);

				edits = rename(document, 5, 13, "renamed");
				assert.equal(edits.length, 6);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 12, 1, 15);
				assertEdit(edits[2], "renamed", 2, 6, 2, 9);
				assertEdit(edits[3], "renamed", 3, 9, 3, 12);
				assertEdit(edits[4], "renamed", 4, 11, 4, 14);
				assertEdit(edits[5], "renamed", 5, 11, 5, 14);
			});

			it("referenced variable $var no value", function() {
				let document = createDocument(instruction + " var\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\nRUN echo \"$var\"\nRUN echo '$var'");
				let edits = rename(document, 0, 5, "renamed");
				assert.equal(edits.length, 6);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 12, 1, 15);
				assertEdit(edits[2], "renamed", 2, 6, 2, 9);
				assertEdit(edits[3], "renamed", 3, 9, 3, 12);
				assertEdit(edits[4], "renamed", 4, 11, 4, 14);
				assertEdit(edits[5], "renamed", 5, 11, 5, 14);

				edits = rename(document, 1, 13, "renamed");
				assert.equal(edits.length, 6);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 12, 1, 15);
				assertEdit(edits[2], "renamed", 2, 6, 2, 9);
				assertEdit(edits[3], "renamed", 3, 9, 3, 12);
				assertEdit(edits[4], "renamed", 4, 11, 4, 14);
				assertEdit(edits[5], "renamed", 5, 11, 5, 14);

				edits = rename(document, 2, 7, "renamed");
				assert.equal(edits.length, 6);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 12, 1, 15);
				assertEdit(edits[2], "renamed", 2, 6, 2, 9);
				assertEdit(edits[3], "renamed", 3, 9, 3, 12);
				assertEdit(edits[4], "renamed", 4, 11, 4, 14);
				assertEdit(edits[5], "renamed", 5, 11, 5, 14);

				edits = rename(document, 3, 11, "renamed");
				assert.equal(edits.length, 6);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 12, 1, 15);
				assertEdit(edits[2], "renamed", 2, 6, 2, 9);
				assertEdit(edits[3], "renamed", 3, 9, 3, 12);
				assertEdit(edits[4], "renamed", 4, 11, 4, 14);
				assertEdit(edits[5], "renamed", 5, 11, 5, 14);

				edits = rename(document, 4, 12, "renamed");
				assert.equal(edits.length, 6);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 12, 1, 15);
				assertEdit(edits[2], "renamed", 2, 6, 2, 9);
				assertEdit(edits[3], "renamed", 3, 9, 3, 12);
				assertEdit(edits[4], "renamed", 4, 11, 4, 14);
				assertEdit(edits[5], "renamed", 5, 11, 5, 14);

				edits = rename(document, 5, 13, "renamed");
				assert.equal(edits.length, 6);
				assertEdit(edits[0], "renamed", 0, 4, 0, 7);
				assertEdit(edits[1], "renamed", 1, 12, 1, 15);
				assertEdit(edits[2], "renamed", 2, 6, 2, 9);
				assertEdit(edits[3], "renamed", 3, 9, 3, 12);
				assertEdit(edits[4], "renamed", 4, 11, 4, 14);
				assertEdit(edits[5], "renamed", 5, 11, 5, 14);
			});
		});
	}

	createVariablesTest("ARG", "ARG", "=");
	createVariablesTest("ENV equals delimiter", "ENV", "=");
	createVariablesTest("ENV space delimiter", "ENV", " ");

	describe("non-existent variable", function() {
		it("${var}", function() {
			let document = createDocument("FROM busybox\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
			let edits = rename(document, 1, 14, "renamed");
			assert.equal(edits.length, 3);
			assertEdit(edits[0], "renamed", 1, 13, 1, 16);
			assertEdit(edits[1], "renamed", 2, 7, 2, 10);
			assertEdit(edits[2], "renamed", 3, 10, 3, 13);

			edits = rename(document, 2, 7, "renamed");
			assert.equal(edits.length, 3);
			assertEdit(edits[0], "renamed", 1, 13, 1, 16);
			assertEdit(edits[1], "renamed", 2, 7, 2, 10);
			assertEdit(edits[2], "renamed", 3, 10, 3, 13);

			edits = rename(document, 3, 11, "renamed");
			assert.equal(edits.length, 3);
			assertEdit(edits[0], "renamed", 1, 13, 1, 16);
			assertEdit(edits[1], "renamed", 2, 7, 2, 10);
			assertEdit(edits[2], "renamed", 3, 10, 3, 13);
		});

		it("referenced variable $var no value", function() {
			let document = createDocument("FROM busybox\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
			let edits = rename(document, 1, 14, "renamed");
			assert.equal(edits.length, 3);
			assertEdit(edits[0], "renamed", 1, 12, 1, 15);
			assertEdit(edits[1], "renamed", 2, 6, 2, 9);
			assertEdit(edits[2], "renamed", 3, 9, 3, 12);

			edits = rename(document, 2, 7, "renamed");
			assert.equal(edits.length, 3);
			assertEdit(edits[0], "renamed", 1, 12, 1, 15);
			assertEdit(edits[1], "renamed", 2, 6, 2, 9);
			assertEdit(edits[2], "renamed", 3, 9, 3, 12);

			edits = rename(document, 3, 11, "renamed");
			assert.equal(edits.length, 3);
			assertEdit(edits[0], "renamed", 1, 12, 1, 15);
			assertEdit(edits[1], "renamed", 2, 6, 2, 9);
			assertEdit(edits[2], "renamed", 3, 9, 3, 12);
		});
	});
});
