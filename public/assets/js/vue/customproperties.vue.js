const customComponents = (t) => {
  switch(t) {
    case "hr": return "property-hr";
    case "text": return "property-text";
    case "number": return "property-number";
    case "textarea": return "property-textarea";
    case "checkbox": return "property-checkbox";
    default: return "";
  }
}

Vue.component('property-hr', {
  props: [ 'name', 'value' ],
  data: function() {
    return {
    };
  },
	template: '<div class="col-md-12"> \
    <div class="form-group bmd-form-group is-filled"> \
      <hr></hr> \
    </div> \
  </div>'
});

Vue.component('property-text', {
  props: {
    'name': { type: String, default: '' },
    'desc': { type: String, default: 'Undefined' },
    'value': { type: String, default: '' },
    'width': { type: Number, default: 3 }
  },
  data: function() {
    return {
      "newvalue": this.value
    };
  },
  watch: {
    newvalue() { this.$emit('changed', this.name, this.newvalue); }
  },
  template: '<div :class="\'col-md-\' + width"> \
    <br /> \
    <div class="form-group bmd-form-group is-filled"> \
      <label class="bmd-label-floating">{{ desc }}</label> \
      <input type="text" class="form-control" v-model="newvalue"> \
    </div> \
  </div>'
});

Vue.component('property-number', {
  props: {
    'name': { type: String, default: '' },
    'desc': { type: String, default: 'Undefined' },
    'value': { type: Number, default: '' },
    'width': { type: Number, default: 3 }
  },
  data: function() {
    return {
      "newvalue": this.value
    };
  },
  watch: {
    newvalue() {
      let v = parseFloat(this.newvalue);
      if(isNaN(v)) v = 0;
      this.newvalue = v;
      this.$emit('changed', this.name, this.newvalue);
    }
  },
  template: '<div :class="\'col-md-\' + width"> \
    <br /> \
    <div class="form-group bmd-form-group is-filled"> \
      <label class="bmd-label-floating">{{ desc }}</label> \
      <input type="text" class="form-control" v-model="newvalue"> \
    </div> \
  </div>'
});

Vue.component('property-textarea', {
  props: {
    'name': { type: String, default: '' },
    'desc': { type: String, default: 'Undefined' },
    'value': { type: String, default: '' },
    'width': { type: Number, default: 6 },
    'rows': { type: Number, default: 3 }
  },
  data: function() {
    return {
      "newvalue": this.value
    };
  },
  watch: {
    newvalue() { this.$emit('changed', this.name, this.newvalue); }
  },
	template: '<div :class="\'col-md-\' + width"> \
    <br /> \
    <div class="form-group bmd-form-group is-filled"> \
      <label class="bmd-label-floating">{{ desc }}</label> \
      <textarea class="form-control" :rows="rows" v-model="newvalue"></textarea> \
    </div> \
  </div>'
});

Vue.component('property-checkbox', {
  props: {
    'name': { type: String, default: '' },
    'desc': { type: String, default: 'Undefined' },
    'value': { type: Boolean, default: false },
    'width': { type: Number, default: 6 }
  },
  data: function() {
    return {
      "newvalue": this.value ? "checked" : ""
    };
  },
  watch: {
    newvalue() { this.$emit('changed', this.name, this.newvalue); }
  },
  template: 
  '<div :class="\'col-md-\' + width"> \
    <div class="form-check is-filled"> \
      <label class="form-check-label"> \
        <input class="form-check-input" type="checkbox" value="" checked="" v-model="newvalue"> \
        <span class="form-check-sign"> \
          <span class="check"></span> \
        </span>{{desc}} \
      </label> \
    </div> \
  </div>'
/*  '<div :class="\'col-md-\' + width"> \
    <div class="form-check is-filled"> \
      <label class="form-check-label bmd-label-floating">{{ desc }} \
        <input class="form-check-input" type="checkbox" v-model="newvalue"> \
      </label> \
    </div> \
  </div>'*/
});
