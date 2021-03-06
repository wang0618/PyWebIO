import {InputItem} from "./base";
import {Session} from "../../session";
import {deep_copy} from "../../utils"

const options_tpl = `
{{#options}}
<option {{#selected}}selected{{/selected}} {{#disabled}}disabled{{/disabled}}>{{label}}</option>
{{/options}}
`;
const select_input_tpl = `
<div class="form-group">
    {{#label}}<label for="{{id_name}}">{{label}}</label>{{/label}}
    <select id="{{id_name}}" aria-describedby="{{id_name}}_help" class="form-control" {{#multiple}}multiple{{/multiple}}>
        ${options_tpl}
    </select>
    <div class="invalid-feedback">{{invalid_feedback}}</div>
    <div class="valid-feedback">{{valid_feedback}}</div>
    <small id="{{id_name}}_help" class="form-text text-muted">{{help_text}}</small>
</div>`;

export class Select extends InputItem {
    static accept_input_types: string[] = ["select"];

    constructor(session: Session, task_id: string, spec: any) {
        super(session, task_id, spec);
    }

    create_element(): JQuery {
        let spec = deep_copy(this.spec);
        const id_name = spec.name + '-' + Math.floor(Math.random() * Math.floor(9999));
        spec['id_name'] = id_name;

        let html = Mustache.render(select_input_tpl, spec);
        this.element = $(html);
        this.setup_select_options(this.element, spec.options);

        // blur事件时，发送当前值到服务器
        this.element.find('select').on("blur", (e) => {
            this.send_value_listener(this, e);
        });
        if(spec.onchange){
            this.element.find('select').on("change", (e) => {
                this.send_value_listener(this, e);
            });
        }
        return this.element;
    }

    setup_select_options(elem: JQuery, options: any) {
        let input_elem = elem.find('select');
        let opts = input_elem.find('option');
        for (let idx = 0; idx < options.length; idx++)
            opts.eq(idx).val(JSON.stringify(options[idx].value));

        // 将额外的html参数加到input标签上
        const ignore_keys = {
            'type': '',
            'label': '',
            'invalid_feedback': '',
            'valid_feedback': '',
            'help_text': '',
            'options': '',
            'datalist': '',
            'multiple': ''
        };
        for (let key in this.spec) {
            if (key in ignore_keys) continue;
            input_elem.attr(key, this.spec[key]);
        }
    }

    update_input(spec: any): any {
        let attributes = spec.attributes;

        if ('options' in attributes) {
            const opts_html = Mustache.render(options_tpl, {options: attributes.options});
            this.element.find('select').empty().append(opts_html);
            this.setup_select_options(this.element, attributes.options);
            delete attributes['options'];
        }

        this.update_input_helper(-1, attributes);
    }

    get_value(): any {
        let raw_val = this.element.find('select').val();
        if (this.spec.multiple) {
            let res: any[] = [];
            for (let i of (raw_val as string[]))
                res.push(JSON.parse(i));
            return res;
        } else {
            return JSON.parse(raw_val as string);
        }
    }
}

