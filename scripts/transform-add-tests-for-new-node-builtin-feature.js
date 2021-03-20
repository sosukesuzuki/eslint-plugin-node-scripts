const semverTruncate = require("semver-truncate");

module.exports = function (fileInfo, { jscodeshift }, options) {
  const j = jscodeshift;

  const module = options.module || "crypto";
  const api = options.api || "foo";
  const supported = options.supported || null;
  const experimental = options.experimental || null;
  const backported = options.backported || null;

  function getSupporterVersion() {
    if (supported && !backported) {
      return supported;
    }
    if (supported && backported) {
      const backportedVersions = backported
        .split(",")
        .reduce((prev, current, index, src) => {
          return `${prev}^${current}${index === src.length - 1 ? "" : ", "}`;
        }, "");
      return `${supported} (backported: ${backportedVersions})`;
    }
    if (experimental) {
      return "(none yet)";
    }
  }

  function generateTestCaseObject(
    module,
    api,
    code,
    version,
    ignores,
    invalid
  ) {
    const optionsObjExpProperties = [
      j.property("init", j.identifier("version"), j.literal(version)),
    ];
    if (ignores) {
      optionsObjExpProperties.push(
        j.property(
          "init",
          j.identifier("ignores"),
          j.arrayExpression([j.literal(`${module}.${api}`)])
        )
      );
    }
    const optionsObjExp = j.objectExpression(optionsObjExpProperties);

    const properties = [
      j.property("init", j.identifier("code"), j.literal(code)),
      j.property("init", j.identifier("options"), optionsObjExp),
    ];

    if (invalid) {
      properties.push(
        j.property(
          "init",
          j.identifier("errors"),
          j.arrayExpression([
            j.objectExpression([
              j.property(
                "init",
                j.identifier("messageId"),
                j.literal("unsupported")
              ),
              j.property(
                "init",
                j.identifier("data"),
                j.objectExpression([
                  j.property(
                    "init",
                    j.identifier("name"),
                    j.literal(`${module}.${api}`)
                  ),
                  j.property(
                    "init",
                    j.identifier("supported"),
                    j.literal(getSupporterVersion())
                  ),
                  j.property(
                    "init",
                    j.identifier("version"),
                    j.literal(version)
                  ),
                ])
              ),
            ]),
          ])
        )
      );
    }
    return j.objectExpression(properties);
  }

  function generateCjsCode(module, api, isConstructor = false) {
    return `const { ${api} } = require("${module}");${
      isConstructor ? "new" : ""
    } ${api}();`;
  }

  function generateEsmCode(module, api, isConstructor = false) {
    return `import { ${api} } from "${module}";${
      isConstructor ? "new" : ""
    }${api}();`;
  }

  return j(fileInfo.source)
    .find(j.ObjectExpression)
    .forEach((path) => {
      const parentPath = path.parent;
      const parentNode = parentPath.node;
      if (parentNode.type !== "ArrayExpression") {
        return;
      }
      const { node } = path;
      const elements = parentNode.elements;
      const lastEl = elements[elements.length - 1];
      if (node !== lastEl) {
        return;
      }
      const parentParentPath = parentPath.parent;
      const parentParentNode = parentParentPath.node;
      if (parentParentNode.type !== "Property") {
        return;
      }

      const isValid = parentParentNode.key.name === "valid";
      const isInvalid = parentParentNode.key.name === "invalid";

      if (!isValid && !isInvalid) {
        return;
      }

      const parentParentParentPath = parentParentPath.parent;
      const parentParentParentNode = parentParentParentPath.node;
      const moduleName = parentParentParentNode.comments[1].value.trim();

      if (moduleName !== module) {
        return;
      }

      if (isValid) {
        if (experimental) {
          j(path).insertAfter(
            generateTestCaseObject(
              module,
              api,
              generateCjsCode(module, api),
              experimental,
              true
            )
          );
          j(path).insertAfter(
            generateTestCaseObject(
              module,
              api,
              generateEsmCode(module, api),
              experimental,
              true
            )
          );
        }
        if (backported) {
          for (const version of backported.split(",")) {
            j(path).insertAfter(
              generateTestCaseObject(
                module,
                api,
                generateCjsCode(module, api),
                version
              )
            );
            j(path).insertAfter(
              generateTestCaseObject(
                module,
                api,
                generateEsmCode(module, api),
                version
              )
            );
          }
        }
        if (supported) {
          j(path).insertAfter(
            generateTestCaseObject(
              module,
              api,
              generateCjsCode(module, api),
              supported,
              true
            )
          );
          j(path).insertAfter(
            generateTestCaseObject(
              module,
              api,
              generateEsmCode(module, api),
              supported,
              true
            )
          );
          j(path).insertAfter(
            generateTestCaseObject(
              module,
              api,
              generateCjsCode(module, api),
              supported
            )
          );
          j(path).insertAfter(
            generateTestCaseObject(
              module,
              api,
              generateEsmCode(module, api),
              supported
            )
          );
        }
      } else if (isInvalid) {
        if (supported) {
          const truncated = semverTruncate(supported, "minor");
          j(path).insertAfter(
            generateTestCaseObject(
              module,
              api,
              generateCjsCode(module, api),
              truncated,
              false,
              true
            )
          );
          j(path).insertAfter(
            generateTestCaseObject(
              module,
              api,
              generateEsmCode(module, api),
              truncated,
              false,
              true
            )
          );
        }
        if (backported) {
          for (const version of backported.split(",")) {
            const truncated = semverTruncate(version, "minor");
            j(path).insertAfter(
              generateTestCaseObject(
                module,
                api,
                generateCjsCode(module, api),
                truncated,
                false,
                true
              )
            );
            j(path).insertAfter(
              generateTestCaseObject(
                module,
                api,
                generateEsmCode(module, api),
                truncated,
                false,
                true
              )
            );
          }
        }
        if (experimental) {
          j(path).insertAfter(
            generateTestCaseObject(
              module,
              api,
              generateCjsCode(module, api),
              experimental,
              false,
              true
            )
          );
          j(path).insertAfter(
            generateTestCaseObject(
              module,
              api,
              generateEsmCode(module, api),
              experimental,
              false,
              true
            )
          );
        }
      }
    })
    .toSource();

  // return fileInfo.source;
};
