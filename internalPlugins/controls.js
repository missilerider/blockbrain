async function controls_repeat_ext(context) {
  var initProgram = context.getProgram();
  var initBlock = context.getBlock();

  var opTimes = parseInt(await context.getValue(context, "TIMES"));

  for(let n = 0; n < opTimes; n++) {
    context.push();
    context.jump({
      program: initProgram,
      block: initBlock
    })
    console.log("Inicia DO");
    var execValue = await context.continue(context, 'DO');
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
  var opFlow = await context.getField(context, "FLOW");

  switch(opFlow) {
    case "BREAK": context.getRunFlow().flowState = 1;
      break;
    case "CONTINUE": context.getRunFlow().flowState = 2;
      break;
  }
}

module.exports = {
  "controls_repeat_ext": { run: controls_repeat_ext },
  "controls_flow_statements": { run: controls_flow_statements }
}
