
var questions = {
    "title": "Questionnaire",
    "description": "",
    "sections": [
        {
            "title": "",
            "questions": [
                {
                    "title": "Please enter your Worker ID",
                    "type": "input",
                    "layout": "horizontal",
                    "required": true
                }
            ]
        },
        {
            "title": "Please answer the following questions based on the tests you performed yesterday.",
            "questions": [
                {
                    "type": "text",
                    "title": "How could the interface be improved to be more intuitive?",
                    "required": true
                },
                {
                    "type": "text",
                    "title": "How could the interface be improved to allow faster control of the object?",
                    "required": true
                },
                {
                    "type": "text",
                    "title": "How could the interface be improved to reduce errors?",
                    "required": true
                },
                {
                    "type": "text",
                    "title": "How could the interface be improved for better accessibility?",
                    "required": false
                },
                {
                    "type": "text",
                    "title": "Any other ways in which the control interface could be improved?",
                    "required": false
                },
                {
                    "title": "Age",
                    "type": "input",
                    "layout": "horizontal",
                    "required": true
                },
                {
                    "title": "What types of computer games do you play the most?",
                    "type": "text",
                    "required": false
                },
                {
                    "title": "What device or interface are you using to move the cursor on your computer?",
                    "type": "radio",
                    "layout": "vertical",
                    "options": ["A mouse", "A trackpad", "A pointing stick", "An assistive device", "Other"],
                    "display-options": true,
                    "required": true
                },
                {
                    "title": "Please describe any relevant details about the device or interface you use for moving the cursor.",
                    "type": "text",
                    "required": false
                },
                {
                    "title": "What device or interface are you using for 'clicking' on your computer?",
                    "type": "radio",
                    "layout": "vertical",
                    "options": ["Mouse buttons", "Trackpad buttons", "Keyboard", "An assistive device", "Other"],
                    "display-options": true,
                    "required": true
                },
                {
                    "title": "Please describe any relevant details about the device or interface you use for clicking.",
                    "type": "text",
                    "required": false
                },
            ]
        },

    ]
};


var required_questions = [];
var num_sections;
var current_section;

var form_data = questions;
generateForm(form_data);
setSection(0);

$(document).ready(function () {
    db.initialize();

    $("#complete").hide();

    $("#next").click(function () {
        if (validateForm()) {
            setSection(current_section + 1);
        }
    });

    $("#back").click(function () {
        if (validateForm()) {
            setSection(current_section - 1);
        }
    });

    $("#form").submit(function (e) {
        e.preventDefault();

        if (validateForm() && current_section == num_sections - 1) {
            Database.logQuestionnaire(getFormData());

            $("#mturk-key").html(`<h3>Thank you for completing this additional survey</h3>`);
            setSection(-1);
        }
    });
});

function generateForm(form_data) {
    $("#title").text(form_data.title);
    $("#description").text(form_data.description);

    var form_container = $("#form-container");

    num_sections = form_data.sections.length;
    current_section = 0;

    for (var section in form_data.sections) {
        form_container.append(`
        <div id='section-${section}'>
            <div class="mb-4"><i>${form_data.sections[section].title}</i></div>
            <div id="section-${section}-questions"></div>
        </div>`);

        var questions_container = $(`#section-${section}-questions`);

        for (var question in form_data.sections[section].questions) {
            var question_data = form_data.sections[section].questions[question];
            questions_container.append(`<div class="mb-4" id="section-${section}-question-${question}"></div>`);
            var question_container = $(`#section-${section}-question-${question}`);
            switch (question_data.type) {
                case "radio":
                    var horizontal = ((question_data.layout == "horizontal") ? "-inline" : "");
                    var required = ((question_data.required) ? `<span class="font-weight-bold text-danger h4">*</span>` : "");

                    var title = question_data.title;

                    question_container.append(`<div class='mb-2'><b>${title}</b> ${((question_data.text) ? question_data.text : "")} ${required}</div>`);
                    var question_id = `section-${section}-question-${question}`;

                    if (typeof question_data["left-text"] !== 'undefined') {
                        question_container.append(`<label class="form-check-label mr-3">${question_data["left-text"]}</label>`);
                    }

                    for (var option in question_data.options) {
                        var option_data = question_data.options[option];
                        var option_id = `section-${section}-question-${question}-option-${option}`;
                        question_container.append(`
                            <div class="form-check form-check${horizontal}">
                                <input class="form-check-input" type="radio" name="${question_id}" id="${option_id}" value="${option_data}"/>
                                <label class="form-check-label" for="${option_id}">${((question_data['display-options']) ? option_data : "")}</label>
                            </div>
                            `);
                    }

                    if (question_data.required) {
                        required_questions.push(question_id);
                    }

                    if (typeof question_data["right-text"] !== 'undefined') {
                        question_container.append(`<label class="form-check-label">${question_data["right-text"]}</label>`);
                    }
                    break;

                case "text":
                    var question_id = `section-${section}-question-${question}-input`;
                    var placeholder = ((question_data.placeholder) ? `placeholder="${question_data.placeholder}"` : "");
                    var required = ((question_data.required) ? `<span class="font-weight-bold text-danger h4">*</span>` : "");
                    question_container.append(`
                    <div class="form-group">
                        <label for="${question_id}">${question_data.title} ${required}</label>
                        <textarea class="form-control" id="${question_id}" ${placeholder}/>
                    </div>
                    `);
                    if (question_data.required) {
                        required_questions.push(question_id);
                    }
                    break;

                case "input":
                    var question_id = `section-${section}-question-${question}-input`;
                    var placeholder = ((question_data.placeholder) ? `placeholder="${question_data.placeholder}"` : "");
                    var required = ((question_data.required) ? `<span class="font-weight-bold text-danger h4">*</span>` : "");
                    question_container.append(`
                    <div class="form-group">
                        <label for="${question_id}"><b>${question_data.title}</b> ${required}</label>
                        <input class="form-control" id="${question_id}" ${placeholder}/>
                    </div>
                    `);
                    if (question_data.required) {
                        required_questions.push(question_id);
                    }
                    break;

            }
        }
    }
}

function setSection(sect_num) {
    $('#form-container').children().each(function () {
        if (this.id.split("-")[1] == sect_num) {
            $(this).show();
            current_section = sect_num;
        } else {
            $(this).hide();
        }
    });

    if (sect_num == 0) {
        $("#back").hide()
        $("#next").show()
        $("#submit").hide()
    } else if (sect_num == num_sections - 1) {
        $("#next").hide()
        $("#back").show()
        $("#submit").show()
    } else {
        $("#next").show()
        $("#back").show()
        $("#submit").hide()
    }


    if (sect_num == -1) {
        $("#back").hide()
        $("#next").hide()
        $("#submit").hide()
        $("#title").hide()

        $("#complete").show();
    }
}

function getFormData() {

    var radios = $('#form').serializeArray().reduce(function (obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});

    var input = {}
    $("#form textarea, #form input").each(function (i, obj) {
        if ($(obj).attr('id').search("input") >= 0) {
            input[$(obj).attr('id')] = $(obj).val();
        }
    });

    return Object.assign({}, radios, input);
}

function validateForm() {
    for (var i = 0; i < required_questions.length; i++) {
        var question_section = required_questions[i].split("-")[1];
        if (question_section <= current_section) {
            if (!(typeof $(`input[name=${required_questions[i]}]:checked`).val() !== "undefined" || $("#" + required_questions[i]).val() !== "")) {
                console.log(required_questions[i], "isn't filled out");
                if (question_section !== current_section) {
                    setSection(Number(question_section));
                }
                $("#" + required_questions[i]).stop().css("background-color", "#FF9C9C")
                    .animate({ backgroundColor: "#FFFFFF" }, 1500);

                return false;
            }
        }
    }
    return true;
}
