function GeneratorParameters()
{
}

GeneratorParameters.prototype.generateHTML = function(params)
{
    var htmlStrings = "";

    for(var key in params)
    {
        var line = "<br>" + params[key][0] + ":";
        var minValue = params[key][1];

        var inputName = "param_" + key;
        line += "<input id=\"" + inputName +  "\" value=\"" + minValue + "\" size=\"3\" type=\"number\" min=" + minValue + "\" onchange=\"pressGenerate()\">";

        // htmlStrings.push(line);
        htmlStrings += line;

    }

    return htmlStrings;
}

GeneratorParameters.prototype.readHTMLValues = function(params)
{
    var values = {};

    for(var key in params)
    {
        var inputName = "param_" + key;
        var value = Number(document.getElementById(inputName).value);

        values[key] = value;
    }

    console.log(values)

    return values;
}