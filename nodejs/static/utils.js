function setBodyHeight() {
    var body = document.getElementById('tbody');
    var header = document.getElementById('thead');
    var table = document.getElementById('table');
    if (body && header && table) {
        var height = window.innerHeight - body.offsetTop;
        if (height < 100)
            height = 100;
        body.style.height = ((body.scrollHeight > height) ? height : body.scrollHeight) + 'px';
    }
};

function tableInit(id = 'table') {
    var table = document.getElementById(id);
    table.innerHTML = '';
    table.header = document.createElement('div');
    table.header.id = 'thead';
    table.appendChild(table.header);
    table.body = document.createElement('div');
    table.body.id = 'tbody';
    table.body.classList.add('tbody');
    //table.body.classList.add('autoscroll');
    table.appendChild(table.body);    
    //window.addEventListener("resize", setBodyHeight);
    return table;
}

function tableRowCreate(table) {
    var row = document.createElement('div');
    row.classList.add('tr');
    if (table)
        table.appendChild(row);
    return row;
}

function tableHeaderCell(row, css, label) {
    var span = document.createElement('span');
    span.classList.add('th');
    if (css)
        span.classList.add(css);
    if (label)
        span.appendChild(document.createTextNode(label));
    row.appendChild(span);
    return span;
}

function tableCell(row, css, value) {
    var span = document.createElement('span');
    span.classList.add('td');
    if (css)
        span.classList.add(css);
    row.appendChild(span);
    if (value)
        span.innerHTML = value;
    return span;
}

function inputCreate(parent, type, css) {
	var value = null;
	if ((parent.childNodes.length === 1) && (parent.childNodes[0].nodeType === 3)) {
		value = parent.innerHTML;
		parent.innerHTML = '';
	}
    var input = document.createElement('input');
    input.classList.add('input');
    if (css)
    	input.classList.add(css);
    input.type = type;
    if ((!type) || (type === 'text')) {
    	parent.classList.remove('pointer');
    }
    else
    	input.classList.add('pointer');

    input.value = value ? value : '';
    parent.appendChild(input);
    return input;
}

function buttonCreate(parent, value, icon_class) {
	var button = document.createElement('button');
	button.classList.add('btn_icon');
	if (icon_class)
		button.classList.add(icon_class);
    if (value)
        button.innerHTML = value;
	parent.appendChild(button);
	return button;

}

function linkCreate(parent, label, href) {
    var a = document.createElement('a');
    var input = inputCreate(a);
    input.classList.add('input');
    input.classList.add('button');
    input.type = 'button';
    input.value = label;
    a.title = label;
    a.href = href;
    parent.appendChild(a);
    return a;
}

function selectCreateOption(label, value) {
    var option = document.createElement('option');
    option.text = label;
    option.value = value;
    return option;
}

function selectCreate(parent, list, undefined, preselect) {
    var select = document.createElement('select');
    select.classList.add('input');
    parent.appendChild(select);
    if (undefined) {
        select.add(selectCreateOption('undefined', '0'));
    }
    for (entry of list) {
    	var selector_name = entry.selector_name ? entry.selector_name : entry;
    	var selector_id = entry.selector_id ? entry.selector_id : entry;
        var option = selectCreateOption(selector_name, selector_id); 
        if ((preselect) && (selector_name == preselect)) {
            option.selected = 'selected';
        }
        select.add(option);
    }    
    return select;    
}

function selectCreateMultiple(parent, list, preselect) {
    var select = document.createElement('select');
    select.classList.add('input');
    parent.appendChild(select);
    select.multiple = true;
    for (index in list) {
    	var selector_name = list[index].selector_name ? list[index].selector_name : list[index];
    	var selector_id = list[index].selector_id ? list[index].selector_id : list[index];
        var option = selectCreateOption(selector_name, selector_id); 
        select.add(option);
        if ((preselect) && (preselect.includes(selector_name))) {
            select.options[index].selected = 'selected';
        }
        
    }
    select.size = list.length;
    return select;
}

function selectCreateYesNo(parent, preselect) {
    var list = [
            { selector_id: 'yes', selector_name: 'yes' },
            { selector_id: 'no', selector_name: 'no' }
        ];
    return selectCreate(parent, list, false, preselect);
}

function parseParams() {
	var param_list = window.location.search.substring(1).split('&');
	var params = {};
	param_list.forEach(function(param) {
		var param_pair = param.split('=');
		if (param_pair.length === 2)
			params[param_pair[0]] = param_pair[1];		
	});
	return params;
}

function ajaxRequest(url, callback) {
    document.getElementById('loading').style.display = '';
    var xhttp = new XMLHttpRequest(); 
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4) {
            switch(xhttp.status) {
                case 200:
                    callback(xhttp.responseText ? JSON.parse(xhttp.responseText) : null);
                    break;
                case 401:
                case 403:
                    document.getElementById('error').innerHTML = 'Access denied';
                    break;
                case 500:
                    document.getElementById('error').innerHTML = xhttp.responseText;
                    break; 
            }                            
            document.getElementById('loading').style.display = 'none';
        }
    };
    xhttp.open('GET' ,url, true);
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhttp.send();
}