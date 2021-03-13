"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const parseMd = require("mdast-util-from-markdown");
const visit = require("unist-util-visit-parents");
const { table } = require("table");
const semverCompare = require("semver/functions/compare");

function parseYamlComment(text) {
  text = text
    .trim()
    .replace(/^<!-- YAML/, "")
    .replace(/-->$/, "");
  const meta = yaml.load(text);
  return meta;
}

const args = process.argv.splice(2);

const fileName = args[0];
const filePath = path.resolve(process.cwd(), "./sources", fileName);
const fileData = fs.readFileSync(filePath, "utf-8");

const tree = parseMd(fileData);

const data = [];

data.push(["API", "Added"]);

visit(tree, "heading", (node, ancestors) => {
  if (node.depth !== 3) {
    return;
  }
  const parent = ancestors[0];
  const siblings = parent.children;
  const nodeIdx = siblings.findIndex((child) => child === node);
  const maybeYamlComment = siblings[nodeIdx + 1];
  if (maybeYamlComment.type !== "html") {
    return;
  }
  let meta = parseYamlComment(maybeYamlComment.value);
  if (meta.added == null) {
    return;
  }
  const added = typeof meta.added === "string" ? [meta.added] : meta.added;
  if (added.every((ver) => semverCompare(ver.substring(1), "11.15.0") !== 1)) {
    return;
  }
  let maybeApiName = node.children[0].value;
  if (maybeApiName === "Class: ") {
    maybeApiName += node.children[1].value;
  }
  data.push([maybeApiName, meta.added]);
});

console.log(table(data));
