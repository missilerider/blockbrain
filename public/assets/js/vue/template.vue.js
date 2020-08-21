// Define a new component called todo-item
Vue.component('nav-sidebar', {
	methods: {
		isCurrent: function(entry) {
			if(location.pathname.split("/").pop().match(entry)) return ["nav-item", "active"];
			return "nav-item";
		}
	},
	template: ' \
  <ul class="nav"> \
    <li v-bind:class="isCurrent(\'index\\.html\')"> \
      <a class="nav-link" href="index.html"> \
        <i class="material-icons">dashboard</i> \
        <p>Dashboard</p> \
      </a> \
    </li> \
    <li v-bind:class="isCurrent(\'(blocks|editor)\\.html\')"> \
      <a class="nav-link" href="blocks.html"> \
        <i class="material-icons">extension</i> \
        <p>Blocks</p> \
      </a> \
    </li> \
    <li v-bind:class="isCurrent(\'blockgroups\\.html\')"> \
      <a class="nav-link" href="blockgroups.html"> \
        <i class="material-icons">timeline</i> \
        <p>Block grouping</p> \
      </a> \
    </li> \
    <li v-bind:class="isCurrent(\'services\\.html\')"> \
      <a class="nav-link" href="services.html"> \
        <i class="material-icons">device_hub</i> \
        <p>Services</p> \
      </a> \
    </li> \
    <li v-bind:class="isCurrent(\'components\\.html\')"> \
      <a class="nav-link" href="components.html"> \
        <i class="material-icons">power</i> \
        <p>Components</p> \
      </a> \
    </li> \
    <li v-bind:class="isCurrent(\'test\\.html\')"> \
      <a class="nav-link" href="test.html"> \
        <i class="material-icons">local_bar</i> \
        <p>Live testing</p> \
      </a> \
    </li> \
    <li v-bind:class="false"> \
      <a class="nav-link" target="_blank" href="/blockly/demos/blockfactory/index.html"> \
        <i class="material-icons-outlined">extension</i> \
        <p>Block editor</p> \
      </a> \
    </li> \
    <li v-bind:class="false"> \
      <a class="nav-link" target="_blank" href="https://material.io/resources/icons/?style=baseline"> \
        <i class="material-icons">material_design</i> \
        <p>Block editor</p> \
      </a> \
    </li> \
  </ul>'
});

Vue.component('nav-bar', {
	methods: {
	},
	template: ' \
	<nav class="navbar navbar-expand-lg navbar-transparent navbar-absolute fixed-top "> \
		<div class="container-fluid"> \
			<div class="navbar-wrapper"> \
				<p class="navbar-brand">Block editor</p> \
			</div> \
			<button class="navbar-toggler" type="button" data-toggle="collapse" aria-controls="navigation-index" aria-expanded="false" aria-label="Toggle navigation"> \
				<span class="sr-only">Toggle navigation</span> \
				<span class="navbar-toggler-icon icon-bar"></span> \
				<span class="navbar-toggler-icon icon-bar"></span> \
				<span class="navbar-toggler-icon icon-bar"></span> \
			</button> \
			<div class="collapse navbar-collapse justify-content-end"> \
				<ul class="navbar-nav"> \
					<li class="nav-item"> \
						<a class="nav-link" href="#pablo"> \
							<i class="material-icons">notifications</i> Notifications \
						</a> \
					</li> \
				</ul> \
			</div> \
		</div> \
	</nav>'
});

// define the tree-item component
Vue.component('tree-item', {
  template: '#item-template',
  props: {
    item: Object
  },
  data: function () {
    return {
      isOpen: false
    }
  },
  computed: {
    isFolder: function () {
      return this.item.children &&
        this.item.children.length
    }
  },
  methods: {
    toggle: function () {
      if (this.isFolder) {
        this.isOpen = !this.isOpen
      }
    },
    makeFolder: function () {
      if (!this.isFolder) {
      	this.$emit('make-folder', this.item)
        this.isOpen = true
      }
    }
  }
})
