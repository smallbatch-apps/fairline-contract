const structsFromAST = ({nodes}) => {
  return nodes[nodes.length-1].nodes
    .filter(({nodeType}) => nodeType === 'StructDefinition')
    .reduce((struct, {name, members}) => {
      members = members.reduce((memberObject, {name, typeDescriptions: {typeString: type}}) => {
        return memberObject.members = mapParameters(members);
      }, {});

      struct[name] = { name, members };
      return struct;
    }, {});
}

const constructorFromAST = ({nodes}) => {
  return nodes[nodes.length-1].nodes
    .filter(({nodeType, isConstructor}) => isConstructor && nodeType === 'FunctionDefinition')
    .reduce((constructor, {parameters = {parameters: []}}) => {
      constructor.parameters = mapParameters(parameters.parameters);
      return constructor;
    },  {});
};

const interfaceFromAST = ({nodes}) => {
  return nodes[nodes.length-1].nodes
    .filter(({nodeType, visibility, isConstructor}) => {
      return (nodeType === 'FunctionDefinition'
      || nodeType ===  'VariableDeclaration')
        && visibility === "public"
        && !isConstructor;
    })
    .reduce((functions, {name, stateMutability = "view", nodeType, typeDescriptions = null, parameters = {parameters: []}, returnParameters = {parameters: []}}) => {
      parameters = mapParameters(parameters.parameters);
      returnParameters = mapParameters(returnParameters.parameters);

      if (!returnParameters.count && nodeType === 'VariableDeclaration') {
        returnParameters.push({name: "", type: typeDescriptions.typeString});
      }

      functions[name] = { name, parameters, returnParameters, stateMutability };

      return functions;
    }, {});
};

const mapParameters = parameters => {
  return parameters.map(({name, typeDescriptions: {typeString: type}}) => ({ name, type }));
};

const enumsFromAST = ({nodes}) => {

  return nodes[nodes.length-1].nodes
    .filter(({nodeType}) => nodeType === 'EnumDefinition')
    .reduce((enumObject, {name, members}) => {
      members = members.map(({name}) => name);
      enumObject[name] = { name, members };
      return enumObject;
    }, {});
}

const eventsFromAST = ({nodes}) => {
  return nodes[nodes.length-1].nodes
    .filter(({nodeType}) => nodeType === 'EventDefinition')
    .reduce((events, {name, parameters = []}) => {
      parameters = mapParameters(parameters.parameters);
      events[name] = { name, parameters };
      return events;
    }, {});
};

const allFromAST = ast => ({
  constructor: constructorFromAST(ast),
  structs: structsFromAST(ast),
  interface: interfaceFromAST(ast),
  events: eventsFromAST(ast),
  enums: enumsFromAST(ast)
});

module.exports = { interfaceFromAST, structsFromAST, enumsFromAST, constructorFromAST, eventsFromAST, allFromAST }