Bloques = {};

Bloques.crearBloque = function(ast) {
  let xml = Bloques.crearXmlBloque(ast);
  if (xml) {
    return Blockly.Xml.domToBlock(xml, Blockly.mainWorkspace);
  }
  return null;
};

Bloques.crearXmlBloque = function(ast) {
  if (ast) {
    if (ast.type in Bloques.mapaBloques) {
      let xml = Bloques.mapaBloques[ast.type](ast);
      return xml;
    }
    alert("No sé qué bloque usar para "+ast.type);
  }
  return null;
};

Bloques.obtenerIdVariable = function(nombre) {
  let variable = Blockly.mainWorkspace.getVariable(nombre);
  if (variable === null) {
    variable = Blockly.mainWorkspace.createVariable(nombre);
  }
  return variable.getId();
};

Bloques.domBloque = function(tipo, hijos) {
  let dom = Blockly.utils.xml.createElement('block');
  dom.setAttribute('type', tipo);
  for (let hijo of hijos) {
    dom.appendChild(hijo);
  }
  return dom;
};

Bloques.domCampo = function(clave, valor) {
  let campo = Blockly.utils.xml.createElement('field');
  Bloques.establecerCampo(campo, clave, valor);
  return campo;
};

Bloques.establecerCampo = function(campo, clave, valor) {
  campo.setAttribute('name', clave);
  campo.appendChild(Blockly.utils.xml.createTextNode(valor));
};

Bloques.domMutador = function(propiedades, hijos) {
  let dom = Blockly.utils.xml.createElement('mutation');
  for (let propiedad in propiedades) {
    dom.setAttribute(propiedad, propiedades[propiedad]);
  }
  for (let hijo of hijos) {
    dom.appendChild(hijo);
  }
  return dom;
};

Bloques.domGenerico = function(tipo, nombre) {
  let dom = Blockly.utils.xml.createElement(tipo);
  if (nombre) {
    dom.setAttribute('name', nombre);
  }
  return dom;
};

Bloques.domInput = function(clave, domBloque) {
  let dom = Blockly.utils.xml.createElement('value');
  dom.setAttribute('name', clave);
  dom.appendChild(domBloque);
  return dom;
};

Bloques.domStatement = function(clave, domBloque) {
  let dom = Blockly.utils.xml.createElement('statement');
  dom.setAttribute('name', clave);
  dom.appendChild(domBloque);
  return dom;
};

Bloques.conectar = function(bloque1, bloque2) {
  let proximo = Bloques.domGenerico('next', null);
  proximo.appendChild(bloque2);
  Bloques.ultimoProximo(bloque1).appendChild(proximo);
};

Bloques.ultimoProximo = function(proximo) {
  let proximoProximo = proximo.getElementsByTagName('next');
  if (proximoProximo.length > 0) {
    return Bloques.ultimoProximo(proximoProximo[0].firstChild);
  }
  return proximo;
};

Bloques.esUnString = function(contenido) {
  return (
    (contenido.startsWith('"') && contenido.endsWith('"')) ||
    (contenido.startsWith("'") && contenido.endsWith("'"))
  )
};

Bloques.esFuncion = function(ast) {
  if (typeof ast != 'object') { return false; }
  if (ast) {
    if ('type' in ast && ast.type == 'ReturnStatement') {
      return true;
    }
    for (let k in ast) {
      if (Array.isArray(ast[k])) {
        for (let x of ast[k]) {
          if (Bloques.esFuncion(x)) {
            return true;
          }
        }
      } else if (Bloques.esFuncion(ast[k])) {
        return true;
      }
    }
  }
  return false;
};

Bloques.registrarParametro = function(funcion, parametro) {
  if (funcion in Bloques.parametros) {
    Bloques.parametros[funcion].push(parametro);
  } else {
    Bloques.parametros[funcion] = [parametro];
  }
};

Bloques.parametroRegistrado = function(funcion, i) {
  if (funcion in Bloques.parametros) {
    if (i < Bloques.parametros[funcion].length) {
      return Bloques.parametros[funcion][i];
    }
  }
  return null;
};

Bloques.iniciar = function() {
  Bloques.funcionesAlFinal = [];
  Bloques.parametros = {};
};

Bloques.hacerAlFinal = function(f) {
  Bloques.funcionesAlFinal.push(f);
}

Bloques.finalizar = function() {
  for (let f of Bloques.funcionesAlFinal) {
    f();
  }
  delete Bloques.funcionesAlFinal;
  delete Bloques.parametros;
};
