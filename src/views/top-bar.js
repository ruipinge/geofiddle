import Backbone from 'backbone';
import {MDCTopAppBar} from '@material/top-app-bar';
import tpl from 'templates/top-bar.html';

export default Backbone.View.extend({

    tagName: 'header',

    className: 'mdc-top-app-bar mdc-top-app-bar--fixed',

    render: function() {
        var html = _.template(tpl, {});
        this.$el.html(html);

        MDCTopAppBar.attachTo(this.$el[0]);

        return this;
    }

});
