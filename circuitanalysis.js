var analysisChart = null;

function resetAnalysisData(analysisData)
{
    analysisData["steps"] = [];
    analysisData["counts"] = [];
    analysisData.nrTGates = 0;
    analysisData.timesteps = 0;
}

function chartAnalysisData(steps, nra, analysis)
{
    if(analysisChart != null) {
        analysisChart.destroy();
    }

    var ctx = document.getElementById("analysisChart").getContext('2d');

    analysisChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: steps,//aStatesData["steps"].slice(0, distillationDepth),
            datasets: [
                {
                    label: '# A states',
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: nra,
                    borderWidth: 1,
                    fill:false,
                    lineTension: 0
                },
                {
                    label: 'Lookahead # A states',
                    backgroundColor: 'rgb(99, 255, 132)',
                    borderColor: 'rgb(99, 255, 132)',
                    data: analysis,
                    borderWidth: 1,
                    fill:false,
                    lineTension: 0
                }],
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true,
                        integerSteps: true
                    }
                }]
            }
        }
    });
}

/*
    Takes a scheduled circuit as input
    and not a gate list with relative time delta
 */
function analyseCircuit(schedGateList, windowLength)
{
    var analysisData = {};

    resetAnalysisData(analysisData);

    var accumulator = new Array();
    //first three are file header
    for(var i=3; i<schedGateList.length; i++)
    {
        var parsedGate = ScheduledGate.parseScheduledGateString(schedGateList[i]);
        if(parsedGate.isComment)
            continue;

        //continuous update
        analysisData.timesteps = Math.max(analysisData.timesteps, parsedGate.timeStep + 1);

        while(parsedGate.timeStep >= accumulator.length)
            accumulator.push(0);

        if(parsedGate.gateType[0] == 't' || parsedGate.gateType[0] == 'a')
        {
            analysisData.nrTGates += parsedGate.wires.length;

            accumulator[parsedGate.timeStep] += parsedGate.wires.length;
        }
    }

    var countAtWindowStart = new Array();
    for(var i=0; i<accumulator.length; i++)
    {
        countAtWindowStart.push (accumulator[i]);

        if(i >= windowLength)
        {
            analysisData["steps"].push(analysisData["counts"].length);
            var total = countAtWindowStart.reduce(function(a, b) { return a + b; }, 0);
            analysisData["counts"].push(total);
            countAtWindowStart.shift();
        }
    }

    while(countAtWindowStart.length > 0)
    {
        analysisData["steps"].push(analysisData["counts"].length);
        var total = countAtWindowStart.reduce(function(a, b) { return a + b; }, 0);
        analysisData["counts"].push(total);
        countAtWindowStart.shift();
    }

    return analysisData;
}