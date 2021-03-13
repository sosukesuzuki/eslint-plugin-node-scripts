"use strict";

const yaml = require("js-yaml");
const parseMd = require("mdast-util-from-markdown");
const visit = require("unist-util-visit-parents");
const { table } = require("table");
const semverCompare = require("semver/functions/compare");
const fetch = require("node-fetch");

function parseYamlComment(text) {
  text = text
    .trim()
    .replace(/^<!-- YAML/, "")
    .replace(/-->$/, "");
  const meta = yaml.load(text);
  return meta;
}

const args = process.argv.splice(2);

const apiName = args[0];
const docUrl = `https://raw.githubusercontent.com/nodejs/node/master/doc/api/${apiName}.md`;

const minVer = args[1] ?? "12.0.0";

(async () => {
  const res = await fetch(docUrl);
  if (!res.ok) {
    throw res;
  }
  const body = await res.text();
  const tree = parseMd(body);

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
    if (
      added.every((ver) => {
        const res = semverCompare(ver.substring(1), minVer);
        return res === -1;
      })
    ) {
      return;
    }
    let maybeApiName = node.children[0].value;
    if (maybeApiName === "Class: ") {
      maybeApiName += node.children[1].value;
    }
    data.push([maybeApiName, meta.added]);
  });

  console.log(table(data));
})();
