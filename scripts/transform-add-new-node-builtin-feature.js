module.exports.parser = "babel";

module.exports = function (fileInfo, { jscodeshift }, options) {
  const j = jscodeshift;

  const module = options.module || "crypto";
  const api = options.api || "foo";
  const supported = options.supported || "10.0.0";
  const experimental = options.experimental || null;
  const backported = options.backported || null;

  return j(fileInfo.source)
    .find(j.Property)
    .forEach((path) => {
      const parentPath = path.parent;
      if (parentPath.node.type !== "ObjectExpression") {
        return;
      }
      const parentParentPath = parentPath.parent;
      const maybeModuleProperty = parentParentPath.node;
      if (
        maybeModuleProperty.type !== "Property" ||
        maybeModuleProperty.key.name !== module
      ) {
        return;
      }
      const moduleObjectProperties = maybeModuleProperty.value.properties;
      const lastProp =
        moduleObjectProperties[moduleObjectProperties.length - 1];

      const { node } = path;
      if (node !== lastProp) {
        return;
      }

      function generateVersionsObjectExpression() {
        const properties = [
          j.property("init", j.identifier("supported"), j.literal(supported)),
        ];
        if (experimental) {
          properties.push(
            j.property(
              "init",
              j.identifier("experimental"),
              j.literal(experimental)
            )
          );
        }
        if (backported) {
          const backportedVersions = backported.split(",");
          const arrayExp = j.arrayExpression(
            backportedVersions.map((version) => j.literal(version))
          );
          properties.push(
            j.property("init", j.identifier("backported"), arrayExp)
          );
        }
        return j.objectExpression(properties);
      }

      path.insertAfter(
        j.property(
          "init",
          j.identifier(api),
          j.objectExpression([
            j.property.from({
              kind: "init",
              key: j.identifier("READ"),
              value: generateVersionsObjectExpression(),
              computed: true,
            }),
          ])
        )
      );
    })
    .toSource();
};
