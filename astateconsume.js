/*
 * Methods for availability and consumption of A states
 */
var availableDistilledAStates = 0;
var reachedTimeStep = -1;

var aStatesData = {};

var currentlyAGenerated = 0;
var maxNrAToGenerate = -1;

var lastStartTime = -1;

const DistillationResult = {
    WORKING : "working",
    DISTILLED : "distilled",
    STOPNOW : "stopnow",
    STOPPED : "stopped",
    STARTNOW : "startnow",
    DONTCARE : "dontcare"//does not affect the gate list or the display of the distillation activity
}

function isDistillationTime(timeStep)
{
    var ret = ((timeStep - lastStartTime) % toolParameters.distillationLength) == 0;

    return ret;
}

/**
 * Returns true if distillation should stop
 * @param timeStep
 */
function updateAvailableDistilledStates(timeStep)
{
    if(evaluateCloseDistillery())
        return DistillationResult.STOPPED;

    if(reachedTimeStep >= timeStep)
        return DistillationResult.DONTCARE;

    var result = DistillationResult.WORKING;
    /*
        this is for a maximum number of distilled states being available
     */
    if(! evaluateStopCondition()) {

        //console.log("u A " + timeStep + " " + availableDistilledAStates);
        if (isDistillationTime(timeStep))
        {
            availableDistilledAStates++;
            currentlyAGenerated++;
            result = DistillationResult.DISTILLED;
        }
    }

    if(evaluateStopCondition())
    {
        if(result == DistillationResult.DISTILLED)
            result = DistillationResult.STOPNOW;
        else
            result = DistillationResult.STOPPED;
    }

    reachedTimeStep = timeStep;

    return result;
}

/**
 * Returns true if the stop condition is fulfilled. False, otherwise.
 */
function evaluateStopCondition()
{
    return (availableDistilledAStates == toolParameters.maximumAAvailable);
}

/**
 * Returns true if all the necessary T states were distilled, and the distillery
 * is not required for the rest of the circuit. False, otherwise.
 */
function evaluateCloseDistillery()
{
    return currentlyAGenerated == maxNrAToGenerate;
}

/**
    Returns true if distillation is allowed to proceed
 */
function consumeDistilledState(timeStep)
{
    var ret = DistillationResult.DONTCARE;

    if(evaluateStopCondition()) {
        ret = DistillationResult.STARTNOW;
        lastStartTime = timeStep;
    }

    availableDistilledAStates--;

    return ret;//already allowed to proceed
}

function checkAvailableDistilledState()
{
    return availableDistilledAStates > 0;
}

function resetAvailableDistilledState()
{
    availableDistilledAStates = 0;

    reachedTimeStep = -1;

    currentlyAGenerated = 0;
    maxNrAToGenerate = -1;

    lastStartTime = -1;

    resetChartData();
}

function resetChartData()
{
    aStatesData.steps = [];
    aStatesData.nra = [];
    aStatesData.separators = [];
}

function appendChartData(timeStep, activityState)
{
    if(aStatesData.steps.indexOf(timeStep) == -1)
    {
        aStatesData.steps.push(timeStep);
        aStatesData.nra.push(availableDistilledAStates);
        aStatesData.separators.push(activityState);
    }
}