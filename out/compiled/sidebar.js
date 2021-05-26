var app = (function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* webviews\components\MemeContainer.svelte generated by Svelte v3.38.2 */

    const file$1 = "webviews\\components\\MemeContainer.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let p0;
    	let t0;
    	let a0;
    	let strong0;
    	let t1;
    	let t2_value = /*data*/ ctx[0].author + "";
    	let t2;
    	let a0_href_value;
    	let t3;
    	let a1;
    	let t4_value = /*data*/ ctx[0].subreddit + "";
    	let t4;
    	let a1_href_value;
    	let t5;
    	let p1;
    	let t6;
    	let span;
    	let strong1;
    	let t7_value = /*data*/ ctx[0].ups + "";
    	let t7;
    	let t8;
    	let h3;
    	let t9_value = /*data*/ ctx[0].title + "";
    	let t9;
    	let t10;
    	let div;
    	let a2;
    	let img;
    	let img_src_value;
    	let a2_href_value;

    	const block = {
    		c: function create() {
    			section = element("section");
    			p0 = element("p");
    			t0 = text("Posted by: ");
    			a0 = element("a");
    			strong0 = element("strong");
    			t1 = text("u/");
    			t2 = text(t2_value);
    			t3 = space();
    			a1 = element("a");
    			t4 = text(t4_value);
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Upvotes: ");
    			span = element("span");
    			strong1 = element("strong");
    			t7 = text(t7_value);
    			t8 = space();
    			h3 = element("h3");
    			t9 = text(t9_value);
    			t10 = space();
    			div = element("div");
    			a2 = element("a");
    			img = element("img");
    			add_location(strong0, file$1, 6, 71, 132);
    			attr_dev(a0, "href", a0_href_value = `https://www.reddit.com/user/${/*data*/ ctx[0].author}/`);
    			attr_dev(a0, "class", "svelte-1u1w686");
    			add_location(a0, file$1, 6, 15, 76);
    			attr_dev(a1, "class", "subreddit svelte-1u1w686");
    			attr_dev(a1, "href", a1_href_value = `https://www.reddit.com/r/${/*data*/ ctx[0].subreddit}/`);
    			add_location(a1, file$1, 7, 4, 175);
    			attr_dev(p0, "class", "svelte-1u1w686");
    			add_location(p0, file$1, 5, 2, 56);
    			add_location(strong1, file$1, 9, 20, 299);
    			add_location(span, file$1, 9, 14, 293);
    			attr_dev(p1, "class", "svelte-1u1w686");
    			add_location(p1, file$1, 9, 2, 281);
    			attr_dev(h3, "class", "img-title svelte-1u1w686");
    			add_location(h3, file$1, 10, 2, 341);
    			add_location(section, file$1, 4, 0, 43);
    			if (img.src !== (img_src_value = /*data*/ ctx[0].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Meme");
    			add_location(img, file$1, 14, 4, 455);
    			attr_dev(a2, "href", a2_href_value = /*data*/ ctx[0].postLink);
    			attr_dev(a2, "class", "svelte-1u1w686");
    			add_location(a2, file$1, 13, 2, 425);
    			attr_dev(div, "class", "img-container");
    			add_location(div, file$1, 12, 0, 394);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, p0);
    			append_dev(p0, t0);
    			append_dev(p0, a0);
    			append_dev(a0, strong0);
    			append_dev(strong0, t1);
    			append_dev(strong0, t2);
    			append_dev(p0, t3);
    			append_dev(p0, a1);
    			append_dev(a1, t4);
    			append_dev(section, t5);
    			append_dev(section, p1);
    			append_dev(p1, t6);
    			append_dev(p1, span);
    			append_dev(span, strong1);
    			append_dev(strong1, t7);
    			append_dev(section, t8);
    			append_dev(section, h3);
    			append_dev(h3, t9);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, a2);
    			append_dev(a2, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 1 && t2_value !== (t2_value = /*data*/ ctx[0].author + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*data*/ 1 && a0_href_value !== (a0_href_value = `https://www.reddit.com/user/${/*data*/ ctx[0].author}/`)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*data*/ 1 && t4_value !== (t4_value = /*data*/ ctx[0].subreddit + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*data*/ 1 && a1_href_value !== (a1_href_value = `https://www.reddit.com/r/${/*data*/ ctx[0].subreddit}/`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*data*/ 1 && t7_value !== (t7_value = /*data*/ ctx[0].ups + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*data*/ 1 && t9_value !== (t9_value = /*data*/ ctx[0].title + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*data*/ 1 && img.src !== (img_src_value = /*data*/ ctx[0].url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*data*/ 1 && a2_href_value !== (a2_href_value = /*data*/ ctx[0].postLink)) {
    				attr_dev(a2, "href", a2_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MemeContainer", slots, []);
    	let { data } = $$props;
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MemeContainer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ data });

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data];
    }

    class MemeContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MemeContainer",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<MemeContainer> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<MemeContainer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<MemeContainer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* webviews\components\Sidebar.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file = "webviews\\components\\Sidebar.svelte";

    // (73:2) {:catch}
    function create_catch_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Something went wrong!";
    			add_location(p, file, 73, 4, 2696);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(73:2) {:catch}",
    		ctx
    	});

    	return block;
    }

    // (71:2) {:then data}
    function create_then_block(ctx) {
    	let memecontainer;
    	let current;

    	memecontainer = new MemeContainer({
    			props: {
    				data: /*currentMeme*/ ctx[0]
    				? /*currentMeme*/ ctx[0]
    				: /*data*/ ctx[12]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(memecontainer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(memecontainer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const memecontainer_changes = {};

    			if (dirty & /*currentMeme, memeFetch*/ 3) memecontainer_changes.data = /*currentMeme*/ ctx[0]
    			? /*currentMeme*/ ctx[0]
    			: /*data*/ ctx[12];

    			memecontainer.$set(memecontainer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(memecontainer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(memecontainer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(memecontainer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(71:2) {:then data}",
    		ctx
    	});

    	return block;
    }

    // (69:20)       <p>Getting you top quality Meme!</p>    {:then data}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Getting you top quality Meme!";
    			add_location(p, file, 69, 4, 2561);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(69:20)       <p>Getting you top quality Meme!</p>    {:then data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let promise;
    	let t0;
    	let div0;
    	let button0;
    	let t2;
    	let button1;
    	let t4;
    	let a;
    	let footer;
    	let current;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 12,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*memeFetch*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			info.block.c();
    			t0 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "⟵";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "→";
    			t4 = space();
    			a = element("a");
    			footer = element("footer");
    			footer.textContent = "If you like the project please consider ⭐staring the repo!";
    			attr_dev(button0, "class", "btn previous-btn svelte-8ta0dk");
    			add_location(button0, file, 76, 4, 2772);
    			attr_dev(button1, "class", "btn next-btn svelte-8ta0dk");
    			add_location(button1, file, 79, 4, 2874);
    			attr_dev(div0, "class", "button-stack svelte-8ta0dk");
    			add_location(div0, file, 75, 2, 2740);
    			attr_dev(footer, "class", "svelte-8ta0dk");
    			add_location(footer, file, 82, 4, 3025);
    			attr_dev(a, "href", "https://github.com/version0chiro/VS-Meme-Reddit");
    			add_location(a, file, 81, 2, 2961);
    			attr_dev(div1, "class", "container svelte-8ta0dk");
    			add_location(div1, file, 67, 0, 2510);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			info.block.m(div1, info.anchor = null);
    			info.mount = () => div1;
    			info.anchor = t0;
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t2);
    			append_dev(div0, button1);
    			append_dev(div1, t4);
    			append_dev(div1, a);
    			append_dev(a, footer);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*handlePreviousBtnClick*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*handleNextBtnClick*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*memeFetch*/ 2 && promise !== (promise = /*memeFetch*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			info.block.d();
    			info.token = null;
    			info = null;
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let memeFetch;
    	let currentMeme;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sidebar", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let visitedMemes = [];

    	class Meme {
    		constructor(url, title, author, ups, postLink, subreddit) {
    			this.url = url;
    			this.title = title;
    			this.author = author;
    			this.ups = ups;
    			this.postLink = postLink;
    			this.subreddit = subreddit;
    		}
    	}

    	class MemeService {
    		getMemes() {
    			return __awaiter(this, void 0, void 0, function* () {
    				const response = yield fetch("https://meme-api.herokuapp.com/gimme");
    				return yield response.json();
    			});
    		}
    	}

    	// two fns to set and get images from localstorage
    	const setImgInStore = imgData => {
    		localStorage.setItem("prevImg", JSON.stringify(imgData));
    	};

    	const getImgFromStore = () => {
    		const prevImg = localStorage.getItem("prevImg");
    		if (prevImg) return JSON.parse(prevImg);
    	};

    	let apiClient = new MemeService();
    	const fetchImage = apiClient.getMemes();

    	const handleNextBtnClick = () => {
    		visitedMemes.push(currentMeme);

    		//2. save that object to the local storage.
    		setImgInStore(visitedMemes);

    		//3. get the next img
    		apiClient.getMemes().then(meme => {
    			console.log("next btn is clicked");
    			$$invalidate(0, currentMeme = meme);
    		});
    	};

    	const handlePreviousBtnClick = () => {
    		// only allow until the stack is available
    		const prevImgs = getImgFromStore();

    		if (prevImgs.length < 1) return;
    		console.log("prev btn is clicked");

    		// get the first object from array...
    		let prevImg = prevImgs.pop();

    		// setback the local storage to modified array
    		setImgInStore(prevImgs);

    		$$invalidate(0, currentMeme = prevImg);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		__awaiter,
    		onMount,
    		MemeContainer,
    		visitedMemes,
    		Meme,
    		MemeService,
    		setImgInStore,
    		getImgFromStore,
    		apiClient,
    		fetchImage,
    		handleNextBtnClick,
    		handlePreviousBtnClick,
    		currentMeme,
    		memeFetch
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("visitedMemes" in $$props) visitedMemes = $$props.visitedMemes;
    		if ("apiClient" in $$props) apiClient = $$props.apiClient;
    		if ("currentMeme" in $$props) $$invalidate(0, currentMeme = $$props.currentMeme);
    		if ("memeFetch" in $$props) $$invalidate(1, memeFetch = $$props.memeFetch);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(1, memeFetch = fetchImage);
    	$$invalidate(0, currentMeme = null);
    	return [currentMeme, memeFetch, handleNextBtnClick, handlePreviousBtnClick];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new Sidebar({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=sidebar.js.map
