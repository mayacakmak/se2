
var questions = {
    "title": "Questionnaire",
    "description": "",
    "sections": [
        {
            "title": "Please answer the following questions based on the tests you just performed.",
            "questions": [
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Mental Demand:",
                    "text": "How much mental and perceptual activity was required?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Very low",
                    "right-text": "Very high",
                    "required": true,
                    "id": "mental-demand-1"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Mental Demand:",
                    "text": "Was the task easy or demanding?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Very easy",
                    "right-text": "Very demanding",
                    "required": true,
                    "id": "mental-demand-2"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Mental Demand:",
                    "text": "Was the task simple or complex?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Very simple",
                    "right-text": "Very complex",
                    "required": true,
                    "id": "mental-demand-3"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Physical Demand:",
                    "text": "How much physical activity was required?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Very low",
                    "right-text": "Very high",
                    "required": true,
                    "id": "physical-demand-1"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Physical Demand:",
                    "text": "Was the task easy or demanding?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Very easy",
                    "right-text": "Very demanding",
                    "required": true,
                    "id": "physical-demand-2"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Physical Demand:",
                    "text": "Was the task slack or strenuous?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Very slack",
                    "right-text": "Very strenuous",
                    "required": true,
                    "id": "physical-demand-3"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Temporal Demand:",
                    "text": "How much time pressure did you feel due to the pace at which the tasks or task elements occurred?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Very low",
                    "right-text": "Very high",
                    "required": true,
                    "id": "temporal-demand-1"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Temporal Demand:",
                    "text": "Was the pace slow or rapid?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Very slow",
                    "right-text": "Very rapid",
                    "required": true,
                    "id": "temporal-demand-2"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Overall Performance:",
                    "text": "How successful were you in performing the task?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Perfect",
                    "right-text": "Failure",
                    "required": true,
                    "id": "overall-performance-1"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Overall Performance:",
                    "text": "How satisfied were you with your performance?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Very satisfied",
                    "right-text": "Very dissatisfied",
                    "required": true,
                    "id": "overall-performance-2"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Effort:",
                    "text": "How hard did you have to work (mentally and physically) to accomplish your level of performance?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Very low",
                    "right-text": "Very high",
                    "required": true,
                    "id": "overall-performance-3"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Frustration Level:",
                    "text": "How irritated versus content did you feel during the task?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Very irritated",
                    "right-text": "Very content",
                    "required": true,
                    "id": "frustration-level-1"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Frustration Level:",
                    "text": "How stressed versus relaxed did you feel during the task?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Very stressed",
                    "right-text": "Very relaxed",
                    "required": true,
                    "id": "frustration-level-2"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Frustration Level:",
                    "text": "How complacent versus annoyed did you feel during the task?",
                    "options": ["1", "2", "3", "4", "5", "6", "7"],
                    "display-options": false,
                    "left-text": "Very complacent",
                    "right-text": "Very annoyed",
                    "required": true,
                    "id": "frustration-level-3"
                }
            ]
        },
        {
            "title": "Please state your agreement with the following statements based on the tests you just performed, and answer related free-form questions.",
            "questions": [
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "The control interface was intuitive.",
                    "text": "",
                    "options": ["Strongly disagree", "Somewhat disagree", "Neither agree/nor disagree", "Somewhat agree", "Strongly agree"],
                    "display-options": true,
                    "left-text": "",
                    "right-text": "",
                    "required": true,
                    "id": "control-intuitive"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "The control interface was easy to learn.",
                    "text": "",
                    "options": ["Strongly disagree", "Somewhat disagree", "Neither agree/nor disagree", "Somewhat agree", "Strongly agree"],
                    "display-options": true,
                    "left-text": "",
                    "right-text": "",
                    "required": true,
                    "id": "control-easy-to-learn"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "The control interface was easy to use once I learned how it works.",
                    "text": "",
                    "options": ["Strongly disagree", "Somewhat disagree", "Neither agree/nor disagree", "Somewhat agree", "Strongly agree"],
                    "display-options": true,
                    "left-text": "",
                    "right-text": "",
                    "required": true,
                    "id": "control-easy-use-once-learned"
                },
                {
                    "type": "text",
                    "title": "How could the interface be improved to be more intuitive?",
                    "required": true,
                    "id": "how-control-more-intuitive"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "The control interface allowed efficient control of the object.",
                    "text": "",
                    "options": ["Strongly disagree", "Somewhat disagree", "Neither agree/nor disagree", "Somewhat agree", "Strongly agree"],
                    "display-options": true,
                    "left-text": "",
                    "right-text": "",
                    "required": true,
                    "id": "control-efficient"
                },
                {
                    "type": "text",
                    "title": "How could the interface be improved to allow faster control of the object?",
                    "required": true,
                    "id": "how-control-more-efficient"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "The control interface was prone to errors.",
                    "text": "",
                    "options": ["Strongly disagree", "Somewhat disagree", "Neither agree/nor disagree", "Somewhat agree", "Strongly agree"],
                    "display-options": true,
                    "left-text": "",
                    "right-text": "",
                    "required": true,
                    "id": "control-prone-to-errors"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "The control interface allowed easy recovery from errors.",
                    "text": "",
                    "options": ["Strongly disagree", "Somewhat disagree", "Neither agree/nor disagree", "Somewhat agree", "Strongly agree"],
                    "display-options": true,
                    "left-text": "",
                    "right-text": "",
                    "required": true,
                    "id": "control-recover-from-errors"
                },
                {
                    "type": "text",
                    "title": "How could the interface be improved to reduce errors?",
                    "required": true,
                    "id": "how-control-reduce-errors"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "The control interface was accessible for people using an assistive device to control the cursor.",
                    "text": "",
                    "options": ["Strongly disagree", "Somewhat disagree", "Neither agree/nor disagree", "Somewhat agree", "Strongly agree"],
                    "display-options": true,
                    "left-text": "",
                    "right-text": "",
                    "required": true,
                    "id": "control-accessible"
                },
                {
                    "type": "text",
                    "title": "How could the interface be improved for better accessibility?",
                    "required": false,
                    "id": "how-control-more-accessible"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Flexible targets were easier to reach.",
                    "text": "",
                    "options": ["Strongly disagree", "Somewhat disagree", "Neither agree/nor disagree", "Somewhat agree", "Strongly agree"],
                    "display-options": true,
                    "left-text": "",
                    "right-text": "",
                    "required": true,
                    "id": "flex-targets-easier"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Far away targets were harder to reach.",
                    "text": "",
                    "options": ["Strongly disagree", "Somewhat disagree", "Neither agree/nor disagree", "Somewhat agree", "Strongly agree"],
                    "display-options": true,
                    "left-text": "",
                    "right-text": "",
                    "required": true,
                    "id": "far-away-harder"
                },
                {
                    "type": "radio",
                    "layout": "horizontal",
                    "title": "Targets with large rotation differences were harder to reach.",
                    "text": "",
                    "options": ["Strongly disagree", "Somewhat disagree", "Neither agree/nor disagree", "Somewhat agree", "Strongly agree"],
                    "display-options": true,
                    "left-text": "",
                    "right-text": "",
                    "required": true,
                    "id": "large-rotation-harder"
                },
                {
                    "type": "text",
                    "title": "Any other ways in which the control interface could be improved?",
                    "required": false,
                    "id": "how-interface-improve-general"
                },
            ]
        },
        {
            "title": "Please answer the following questions about yourself and the computer system you are using.",
            "questions": [
                {
                    "title": "Age",
                    "type": "input",
                    "layout": "horizontal",
                    "required": true,
                    "id": "age"
                },
                {
                    "title": "Gender",
                    "type": "radio",
                    "layout": "vertical",
                    "options": ["Male", "Female", "Non-binary", "Do not wish to share"],
                    "display-options": true,
                    "required": true,
                    "id": "gender"
                },
                {
                    "title": "How often do you use a computer?",
                    "type": "radio",
                    "layout": "vertical",
                    "options": ["Everyday, during a majority of business hours", "Everyday, a few hours", "Everyday, less than an hour", "Once or twice a week", "Rarely"],
                    "display-options": true,
                    "required": true,
                    "id": "computer-usage-general"
                },
                {
                    "title": "How often do you play computer games?",
                    "type": "radio",
                    "layout": "vertical",
                    "options": ["Everyday, a few hours", "Everyday, less than an hour", "Once or twice a week", "Rarely"],
                    "display-options": true,
                    "required": true,
                    "id": "computer-usage-games"
                },
                {
                    "title": "What types of computer games do you play the most?",
                    "type": "text",
                    "required": false,
                    "id": "which-games"
                },
                {
                    "title": "What device or interface are you using to move the cursor on your computer?",
                    "type": "radio",
                    "layout": "vertical",
                    "options": ["A mouse", "A trackpad", "A pointing stick", "An assistive device", "Other"],
                    "display-options": true,
                    "required": true,
                    "id": "cursor-move-device"
                },
                {
                    "title": "Please describe any relevant details about the device or interface you use for moving the cursor.",
                    "type": "text",
                    "required": false,
                    "id": "cursor-move-device-details"
                },
                {
                    "title": "What device or interface are you using for 'clicking' on your computer?",
                    "type": "radio",
                    "layout": "vertical",
                    "options": ["Mouse buttons", "Trackpad buttons", "Keyboard", "An assistive device", "Other"],
                    "display-options": true,
                    "required": true,
                    "id": "cursor-click-device"
                },
                {
                    "title": "Please describe any relevant details about the device or interface you use for clicking.",
                    "type": "text",
                    "required": false,
                    "id": "cursor-click-device-details"
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
            Database.logQuestionnaire(getFormData(), controlTypesMap[controlType], transitionTypesMap[transitionType]);

            $("#mturk-key").html(`<h3>Thank you!</h3> <br> Here is your AMT completion code: <kbd>${Database.uid}</kbd>`);
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
            questions_container.append(`<div class="mb-4" id="section-${section}-question-${question}" qid="${question_data.id}"></div>`);
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
                        <textarea class="form-control" id="${question_id}" qid="${question_data.id}" ${placeholder}/>
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
                        <input class="form-control" id="${question_id}" qid="${question_data.id}" ${placeholder}/>
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
        obj[item.name] = {
            resp: item.value,
            qid: $("#"+item.name).attr('qid')
        };
        return obj;
    }, {});

    var input = {}
    $("#form textarea, #form input").each(function (i, obj) {
        if ($(obj).attr('id').search("input") >= 0) {
            input[$(obj).attr('id').replace("-input", "")] = {
                resp: $(obj).val(),
                qid: $(obj).attr('qid')
            };
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
                document.getElementById(required_questions[i]).scrollIntoView();

                return false;
            }
        }
    }
    return true;
}
