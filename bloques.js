Bloques = {};

Bloques.crearBloque = function(ast) {
  let xml = Bloques.crearXmlBloque(ast, {});
  if (xml) {
    return Blockly.Xml.domToBlock(xml, Blockly.mainWorkspace);
  }
  return null;
};

Bloques.crearXmlBloque = function(ast, opciones={}) {
  if (ast != null) {
    if (ast.type != null && ast.type in Bloques.mapaBloques) {
      let xml = Bloques.mapaBloques[ast.type](ast, opciones);
      return xml;
    }
    console.error(ast);
    Main.error("No sé qué bloque usar para "+ast.type);
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

Bloques.registrarFuncion = function(nombre) {
  if (nombre in Bloques.funcionesYProcedimientos) {
    Bloques.funcionesYProcedimientos[nombre].tipo = 'funcion';
  } else {
    Bloques.funcionesYProcedimientos[nombre] = {
      parametros: [],
      tipo: 'funcion'
    };
  }
};
Bloques.registrarProcedimiento = function(nombre) {
  if (nombre in Bloques.funcionesYProcedimientos) {
    Bloques.funcionesYProcedimientos[nombre].tipo = 'procedimiento';
  } else {
    Bloques.funcionesYProcedimientos[nombre] = {
      parametros: [],
      tipo: 'procedimiento'
    };
  }
};

Bloques.esFuncionSimple = function(lista_comandos) {
  if (lista_comandos.length == 0) { return true; }
  let ultimo = lista_comandos[lista_comandos.length-1];
  if (ultimo.type != null && ultimo.type != 'ReturnStatement') { return false; }
  return !Bloques.esFuncion(lista_comandos.slice(0, -1));
};

Bloques.esFuncion = function(ast) {
  if (typeof ast != 'object') { return false; }
  if (ast) {
    if (ast.type != null && ast.type == 'ReturnStatement') {
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
  if (funcion in Bloques.funcionesYProcedimientos) {
    Bloques.funcionesYProcedimientos[funcion].parametros.push(parametro);
  } else {
    Bloques.funcionesYProcedimientos[funcion] = {
      parametros: [parametro],
      tipo: 'procedimiento'
    };
  }
};

Bloques.parametroRegistrado = function(funcion, i) {
  if (funcion in Bloques.funcionesYProcedimientos) {
    if (i < Bloques.funcionesYProcedimientos[funcion].parametros.length) {
      return Bloques.funcionesYProcedimientos[funcion].parametros[i];
    }
  }
  return null;
};

Bloques.funcionRegistrada = function(nombre) {
  return nombre in Bloques.funcionesYProcedimientos &&
    Bloques.funcionesYProcedimientos[nombre].tipo == 'funcion';
};

Bloques.procedimientoRegistrado = function(nombre) {
  return nombre in Bloques.funcionesYProcedimientos &&
    Bloques.funcionesYProcedimientos[nombre].tipo == 'procedimiento';
};

Bloques.iniciar = function() {
  Bloques.funcionesAlFinal = [];
  Bloques.funcionesYProcedimientos = {};
};

Bloques.hacerAlFinal = function(f) {
  Bloques.funcionesAlFinal.push(f);
}

Bloques.finalizar = function() {
  for (let f of Bloques.funcionesAlFinal) {
    f();
  }
  delete Bloques.funcionesAlFinal;
  delete Bloques.funcionesYProcedimientos;
};
