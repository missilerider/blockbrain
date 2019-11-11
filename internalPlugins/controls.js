async function controls_repeat_ext(context) {
  context.blockIn();
  var initProgram = context.getProgram();
  var initBlock = context.getBlock();

  var opTimes = parseInt(await context.getValue("TIMES"));

  for(let n = 0; n < opTimes; n++) {
    context.push();
    context.jump({
      program: initProgram,
      block: initBlock
    })
    console.log("Inicia DO");
    var execValue = await context.continue('DO');
    console.log("Termina DO");
    context.pop();
    switch(context.getRunFlow().flowState) {
      case 1: // BREAK
        context.getRunFlow().flowState = 0; // Run normally
        return; // Stop loop

      case 2: // CONTINUE
        context.getRunFlow().flowState = 0; // Run normally
        break; // Continue loop
    }
  }
}

async function controls_flow_statements(context) {
  context.blockIn();
  var opFlow = await context.getField("FLOW");

  switch(opFlow) {
    case "BREAK": context.getRunFlow().flowState = 1;
      break;
    case "CONTINUE": context.getRunFlow().flowState = 2;
      break;
  }
}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

sleepBlock = {
  block: {
    "type": "sleep",
    "message0": "sleep %1 ms",
    "args0": [
      {
        "type": "field_input",
        "name": "MS",
        "text": "1000"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 60,
    "tooltip": "Suspends the execution for the specified milliseconds",
    "helpUrl": ""
  },
  run: async function(context) {
    context.blockIn();
    let ms = context.getField("MS");
    await sleep(ms);
  }
}

function getBlocks() {
  return {
    "controls_repeat_ext": { run: controls_repeat_ext },
    "controls_flow_statements": { run: controls_flow_statements },
    "sleep": sleepBlock
  }
}

function getToolbox() {
  return {
    "default": {
      "Functions": ' \
        <block type="sleep"></block>'
    }
  }
}

module.exports = {
  getBlocks: getBlocks,
  getToolbox: getToolbox
}
