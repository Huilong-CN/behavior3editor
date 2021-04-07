b3e.editor.ExportManager = function (editor) {
  "use strict";

  function getBlockChildrenIds(block) {
    var conns = block._outConnections.slice(0);
    // conns.forEach(c => {
    //   console.log("slice0", c.name, c.title)
    // });
    // var len = conns.length;
    // for (var i = 0; i < len; i++) {
    //   if (!conns[i]._outBlock) {
    //     console.log("remove connection:", conns[i])
    //     conns.splice(i--, 1);
    //   }
    // }
    var i = conns.length;
    while (i--) {
      if (!conns[i]._outBlock) {
        console.log("remove connection:", conns[i])
        if (conns[i]._inBlock) {
          console.log("remove connection:", conns[i]._inBlock.name, conns[i]._inBlock.title, conns[i]._inBlock.description)
        }
        conns.splice(i, 1);
      }
    }
    if (editor._settings.get('layout') === 'horizontal') {
      conns.sort(function (a, b) {
        return a._outBlock.y -
          b._outBlock.y;
      });
    } else {
      conns.sort(function (a, b) {
        return a._outBlock.x -
          b._outBlock.x;
      });
    }

    var nodes = [];
    for (var i = 0; i < conns.length; i++) {
      nodes.push(conns[i]._outBlock.id);
    }

    return nodes;
  }

  this.projectToData = function () {
    var project = editor.project.get();
    if (!project) return;

    var tree = project.trees.getSelected();

    var data = {
      version: b3e.VERSION,
      scope: 'project',
      selectedTree: (tree ? tree._id : null),
      trees: [],
      custom_nodes: this.nodesToData()
    };

    project.trees.each(function (tree) {
      var d = this.treeToData(tree, true);
      d.id = tree._id;
      data.trees.push(d);
    }, this);

    return data;
  };

  this.treeToData = function (tree, ignoreNodes) {
    var project = editor.project.get();
    if (!project) return;

    if (!tree) {
      tree = project.trees.getSelected();
    } else {
      tree = project.trees.get(tree);
      if (!tree) return;
    }

    var root = tree.blocks.getRoot();
    console.log("exporting tree", tree.name, tree.title)
    var first = getBlockChildrenIds(root);
    var data = {
      version: b3e.VERSION,
      scope: 'tree',
      id: tree._id,
      title: root.title,
      description: root.description,
      root: first[0] || null,
      properties: root.properties,
      nodes: {},
      display: {
        camera_x: tree.x,
        camera_y: tree.y,
        camera_z: tree.scaleX,
        x: root.x,
        y: root.y,
      },
    };

    if (!ignoreNodes) {
      data.custom_nodes = this.nodesToData();
    }

    tree.blocks.each(function (block) {
      if (block.category !== 'root') {
        for (var key in block.properties) {
          if (typeof block.properties[key] != 'string' && block.properties[key] !== undefined) {
            block.properties[key] = block.properties[key].toString()
          }
        }
        var d = {
          id: block.id,
          name: block.name,
          category: block.category,
          title: block.title,
          description: block.description,
          properties: block.properties,
          display: { x: block.x, y: block.y }
        };

        var children = getBlockChildrenIds(block);
        if (block.category === 'composite') {
          d.children = children;
        } else if (block.category === 'decorator') {
          d.child = children[0];
        }

        data.nodes[block.id] = d;
      }
    });

    return data;
  };

  this.nodesToData = function () {
    var project = editor.project.get();
    if (!project) return;

    var data = [];
    project.nodes.each(function (node) {
      if (!node.isDefault) {
        for (var key in node.properties) {
          // console.log(typeof node.properties[key], node.properties[key])
          if (typeof node.properties[key] != 'string' && node.properties[key] !== undefined) {
            node.properties[key] = node.properties[key].toString()
          }
        }
        data.push({
          version: b3e.VERSION,
          scope: 'node',
          name: node.name,
          category: node.category,
          title: node.title,
          description: node.description,
          properties: node.properties,
        });
      }
    });

    return data;
  };

  this.nodesToJavascript = function () { };

  this._applySettings = function (settings) { };
};