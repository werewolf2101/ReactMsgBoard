var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var Comment = React.createClass({displayName: 'Comment',
	render: function() {
		return (
			React.createElement("div", {className: "comment"}, 
				React.createElement("div", {className: "comment-body"}, 
					this.props.children
				), 
				React.createElement("p", {className: "comment-origin"}, 
					React.createElement("span", {className: "comment-name"}, this.props.author), " posted at ", this.props.dtime
				)
			)
		);
	}
});

var CommentList = React.createClass({displayName: 'CommentList',
	render: function() {
		var commentNodes = this.props.data.map(function(comment, i) {
			return (
				React.createElement(Comment, {key: comment._id, author: comment.author, dtime: comment.dtime}, 
					comment.msg
				)
			);
		});
		
		return (
			React.createElement("div", {className: "comment-list"}, 
				React.createElement(ReactCSSTransitionGroup, {transitionName: "comment", transitionLeave: false}, 
		          commentNodes
		        )
			)
		);
	}
});

var CommentForm = React.createClass({displayName: 'CommentForm',
	name: localStorage.getItem("name"),
	handleSubmit: function(e) {
		e.preventDefault();
		var author = this.refs.author.getDOMNode().value.trim();
		var msg = this.refs.msg.getDOMNode().value.trim();
		if (!author || !msg) {
			return;
		}
		
		this.name = author;
		localStorage.setItem("name", author);
		this.props.onCommentSubmit({author: author, msg: msg});
		this.refs.author.getDOMNode().value = '';
		this.refs.msg.getDOMNode().value = '';
		return;
	},
	handleBlur: function() {
		var promise,
			author = this.refs.author.getDOMNode().value.trim();

		promise = $.ajax({
			url: "/nameIsExisted",
			type: "post",
			dataType: "json",
			data: {author: author}
		})

	},
	render: function() {
		return (
			React.createElement("div", {className: "comment-form", onSubmit: this.handleSubmit}, 
				React.createElement("form", null, 
					React.createElement("p", null, React.createElement("input", {type: "text", placeholder: "Your name...", ref: "author", defaultValue: this.name, onBlur: this.handleBlur})), 
					React.createElement("p", null, React.createElement("textarea", {placeholder: "Say something...", ref: "msg"})), 
					React.createElement("p", null, React.createElement("input", {type: "submit", value: "submit"}))
				)	
			)
		);
	}
});

var CommentBox = React.createClass({displayName: 'CommentBox',
	page: 1,
	flag: true,
	load: function() {
		var promise,
			that = this;

		promise =  $.ajax({
			url: "/list",
			type: "post",
			dataType: "json",
			data: {page: this.page}
		});

		promise.done(function(data) {
			if (data) {
				that.setState({data: data});
			}
		});

		promise.fail(function(data) {
			console.log(data);
		});
	},
	handleCommentSubmit: function(comment) {
		var promise,
			that = this;

		promise = $.ajax({
			url: "/save",
			type: "post",
			dataType: "json",
			data: comment,
			beforeSend: function() {
				this.setState({addLoading: "loading show"});
			}.bind(this)
		});

		promise.done(function(data) {
			if (data) {
				var comments = that.state.data,
					newComments = [data[0]].concat(comments);
				that.setState({
					data: newComments,
					addLoading: "loading"
				});
			}
		});

		promise.fail(function(data) {
			console.log(data);
		});
	},
	loadMore: function() {
		var promise,
			that = this;

		that.page++;

		promise = $.ajax({
			url: "/list",
			type: "post",
			dataType: "json",
			data: {page: that.page},
			beforeSend: function() {
				this.setState({moreLoading: "loading show"});
			}.bind(this)
		});

		promise.done(function(data) {
			if (data && data.length > 0) {
				var comments = that.state.data,
					newComments = comments.concat(data);

				that.setState({
					data: newComments,
					moreLoading: "loading"
				});
				that.flag = true;
			} else {
				that.setState({
					noMore: "no-more show",
					moreLoading: "loading"
				});
				that.flag = false;
			}
		});

		promise.fail(function(data) {
			console.log(data);
		});
	},
	handleScroll: function() {
		var top = $(window).scrollTop(),
			docHeight = $(document).height(),
			winHeight = $(window).height();

		if (this.flag && docHeight - winHeight - top < 30) {
			this.flag = this.loadMore();
		}
	},
	getInitialState: function() {
		return {
			data: [],
			noMore: "no-more",
			addLoading: "loading",
			moreLoading: "loading"
		};
	},
	componentDidMount: function() {
		this.load();
		window.addEventListener('scroll', this.handleScroll);
	},
	render: function() {
		return (
			React.createElement("div", {className: "comment-box"}, 
				React.createElement(CommentForm, {onCommentSubmit: this.handleCommentSubmit}), 
				React.createElement("div", {className: this.state.addLoading}, React.createElement("p", null)), 
				React.createElement(CommentList, {data: this.state.data}), 
				React.createElement("div", {className: this.state.moreLoading}, React.createElement("p", null)), 
				React.createElement("p", {className: this.state.noMore}, "已经到底啦~")
			)
		);
	}
});

React.render(
  React.createElement(CommentBox, null),
  document.getElementById("commentWrap")
);