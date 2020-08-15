
var questions = {
    "title": "Post Experiment Questionnaire",
    "description": "We should add some description text here",
    "sections": [
        {
            "title": "Evaluating the Interface CHANGE TO NASA-TLX wording",
            "questions": [
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "The interface was easy to use",
                    "options": ["1", "2", "3", "4", "5"],
                    "left-text": "(Strongly disagree)",
                    "right-text": "(Strongly agree)",
                    "required": true
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "The interface allowed me to complete the task fast",
                    "options": ["1", "2", "3", "4", "5"],
                    "left-text": "(Strongly disagree)",
                    "right-text": "(Strongly agree)",
                    "required": true
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "The interface helped to keep my frustration levels low",
                    "options": ["1", "2", "3", "4", "5"],
                    "left-text": "(Strongly disagree)",
                    "right-text": "(Strongly agree)",
                    "required": true
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "The interface could be used to teleoperate a robot effectively",
                    "options": ["1", "2", "3", "4", "5"],
                    "left-text": "(Strongly disagree)",
                    "right-text": "(Strongly agree)",
                    "required": true
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "The interface helped make the task easy to accomplish",
                    "options": ["1", "2", "3", "4", "5"],
                    "left-text": "(Strongly disagree)",
                    "right-text": "(Strongly agree)",
                    "required": true
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "The interface can be considered accessible for users with mobility impairments",
                    "options": ["1", "2", "3", "4", "5"],
                    "left-text": "(Strongly disagree)",
                    "right-text": "(Strongly agree)",
                    "required": true
                }
            ]
        },
        {
            "title": "Open ended questions and statement agreement",
            "questions": []
        },
        {
            "title": "Suggestions and Recommendations",
            "questions": [
                {
                    "type": "input",
                    "title": "Is there any additional feature that you consider will make the interface more accessible to users who may have mobility impairments?",
                    "required": true
                },
                {
                    "type": "input",
                    "title": "Are there any other recommendations that you wish to share with us?"
                }
            ]
        },
        {
            "title": "Demographics - About you",
            "questions": [
                {
                    "title": "Age",
                    "type": "radio",
                    "layout": "vertical",
                    "options": ["18-24", "25-34", "35-44", "45-54", "55-64", "65-74", "above 75"],
                    "required": true
                },
                {
                    "title": "Gender",
                    "type": "radio",
                    "layout": "vertical",
                    "options": ["Male", "Female", "Non-binary", "Do not wish to share"],
                    "required": true
                },
                {
                    "title": "How often do you use a computer?",
                    "type": "radio",
                    "layout": "vertical",
                    "options": ["Everyday, during a majority of business hours", "Everyday, a few hours", "Everyday, less than an hour", "Once or twice a week", "Rarely"],
                    "required": true
                },
                {
                    "title": "How often do you use word processors such as Microsoft Word, Apple Page, Google Doc, etc.?",
                    "type": "radio",
                    "layout": "vertical",
                    "options": ["Everyday, during a majority of business hours", "Everyday, a few hours", "Everyday, less than an hour", "Once or twice a week", "Rarely"],
                    "required": true
                }
            ]
        }
    ]
};


// var form_data;
var required_questions = [];
var num_sections;
var current_section;

var form_data = questions;
generateForm(form_data);
setSection(0);

$(document).ready(function () {
    $("#complete").hide();

    // $(document).load("questionnaire.json", '', function (response) {
    //     form_data = JSON.parse(response);
    //     generateForm(form_data);
    //     setSection(0);
    // });

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

        if (validateForm()) {
            setSection(-1);
            var data = getFormData();
            console.log(data);
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
            <h2 class="mb-4">${form_data.sections[section].title}</h2>
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
                    var required = ((question_data.required) ? "required" : "");

                    question_container.append(`<h3>${question_data.title}</h3>`);
                    var question_id = `section-${section}-question-${question}`;

                    if (typeof question_data["left-text"] !== 'undefined') {
                        question_container.append(`<label class="form-check-label">${question_data["left-text"]}</label>`);
                    }

                    for (var option in question_data.options) {
                        var option_data = question_data.options[option];
                        var option_id = `section-${section}-question-${question}-option-${option}`;
                        question_container.append(`
                            <div class="form-check form-check${horizontal}">
                                <input class="form-check-input" type="radio" name="${question_id}" id="${option_id}" value="${option_data}"/>
                                <label class="form-check-label" for="${option_id}">${option_data}</label>
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
                case "input":
                    var question_id = `section-${section}-question-${question}-input`;
                    var placeholder = ((question_data.placeholder) ? `placeholder="${question_data.placeholder}"` : "");
                    question_container.append(`
                    <div class="form-group">
                        <label for="${question_id}">${question_data.title}</label>
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

        $("#complete").show();
    }
}

function getFormData() {
    var data = $('#form').serializeArray().reduce(function (obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});

    return data;
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
