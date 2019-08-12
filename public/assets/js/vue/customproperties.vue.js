Vue.component('property-hr', {
  props: [ 'name', 'value' ],
  data: function() {
    return {
    };
  },
	template: '<div class="col-md-12"> \
    <div class="form-group bmd-form-group"> \
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
    <div class="form-group bmd-form-group"> \
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
    <div class="form-group bmd-form-group"> \
      <label class="bmd-label-floating">{{ desc }}</label> \
      <textarea class="form-control" :rows="rows" v-model="newvalue"></textarea> \
    </div> \
  </div>'
});
