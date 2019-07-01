// Define a new component called todo-item
Vue.component('nav-sidebar', {
	methods: {
		isCurrent: function(entry) {
			if(location.pathname.split("/").pop() == entry) return ["nav-item", "active"];
			return "nav-item";
		}
	},
	template: ' \
  <ul class="nav"> \
    <li v-bind:class="isCurrent(\'index.html\')"> \
      <a class="nav-link" href="index.html"> \
        <i class="material-icons">dashboard</i> \
        <p>Dashboard</p> \
      </a> \
    </li> \
    <li v-bind:class="isCurrent(\'blocks.html\')"> \
      <a class="nav-link" href="blocks.html"> \
        <i class="material-icons">extension</i> \
        <p>Blocks</p> \
      </a> \
    </li> \
    <li v-bind:class="isCurrent(\'blockgroups.html\')"> \
      <a class="nav-link" href="blockgroups.html"> \
        <i class="material-icons">timeline</i> \
        <p>Block grouping</p> \
      </a> \
    </li> \
    <li v-bind:class="isCurrent(\'services.html\')"> \
      <a class="nav-link" href="services.html"> \
        <i class="material-icons">device_hub</i> \
        <p>Services</p> \
      </a> \
    </li> \
    <li v-bind:class="isCurrent(\'components.html\')"> \
      <a class="nav-link" href="components.html"> \
        <i class="material-icons">power</i> \
        <p>Components</p> \
      </a> \
    </li> \
    <li v-bind:class="isCurrent(\'test.html\')"> \
      <a class="nav-link" href="test.html"> \
        <i class="material-icons">local_bar</i> \
        <p>Live testing</p> \
      </a> \
    </li> \
  </ul>'
});
