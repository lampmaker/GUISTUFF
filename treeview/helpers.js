// Copyright (c) 2024 Matthijs Keuper
// SPDX-License-Identifier: MIT

export function getNodeByPath(data, path) {
    if (typeof path !== 'string') return null;
    const parts = path.split('.').map(Number);
    let current = data;
    for (let i = 0; i < parts.length; i++) {
        const index = parts[i];
        if (!current[index]) return null;
        if (i === parts.length - 1) {
            return current[index];
        }
        current = current[index].children;
        if (!current) return null;
    }
    return null;
}

export function visitAllNodes(nodes, basePath, cb) {
    nodes.forEach((node, index) => {
        const path = basePath ? `${basePath}.${index}` : `${index}`;
        cb(node, path);
        if (node.children) {
            visitAllNodes(node.children, path, cb);
        }
    });
}

export function debugNodes(nodes, basePath = '') {
    nodes.forEach((node, index) => {
        const path = basePath ? `${basePath}.${index}` : `${index}`;
        console.log(`Path: ${path}, Label: ${node.label}, Expanded: ${node.expanded}, Has Children: ${node.children ? node.children.length : 0}`);
        if (node.children) {
            debugNodes(node.children, path);
        }
    });
}

export function removeNodeFromPath(data, path) {
    const parts = path.split('.').map(Number);
    if (parts.length === 1) {
        data.splice(parts[0], 1);
        return;
    }
    const parentPath = parts.slice(0, -1).join('.');
    const parent = getNodeByPath(data, parentPath);
    if (parent && parent.children) {
        parent.children.splice(parts[parts.length - 1], 1);
    }
}

export function moveNode(data, sourcePath, targetPath, position = 'inside') {
    const sourceNode = getNodeByPath(data, sourcePath);
    if (!sourceNode) return false;

    const clone = JSON.parse(JSON.stringify(sourceNode));
    removeNodeFromPath(data, sourcePath);

    if (position === 'before' || position === 'after') {
        const parts = targetPath.split('.');
        const index = Number(parts.pop());
        const parentPath = parts.join('.');
        const parentNode = parentPath ? getNodeByPath(data, parentPath) : { children: data };
        if (!parentNode || !parentNode.children) return false;
        let insertIndex = index;
        if (position === 'after') insertIndex += 1;
        parentNode.children.splice(insertIndex, 0, clone);
        return true;
    }

    const targetNode = getNodeByPath(data, targetPath);
    if (!targetNode) return false;
    if (!targetNode.children) targetNode.children = [];
    targetNode.children.push(clone);
    targetNode.expanded = true;
    return true;
}

export function canNodeAcceptChild(parentNode, childNode, nodeTypes, draggedPath = null, targetPath = null) {
    if (!parentNode || !childNode) return false;

    if (draggedPath && targetPath) {
        if (targetPath === draggedPath || targetPath.startsWith(draggedPath + '.')) {
            return false;
        }
    }

    const parentType = parentNode.type || 'custom';
    const allowedChildren = parentNode.allowedChildren || nodeTypes[parentType]?.allowedChildren || [];
    if (allowedChildren.length === 0) return false;

    const childType = childNode.type || 'custom';
    return allowedChildren.includes(childType);
}

export function validateDragDropOperation(data, sourcePath, targetPath, nodeTypes, position = 'inside') {
    if (!sourcePath || !targetPath || sourcePath === targetPath) {
        return { valid: false, reason: 'Invalid source or target path' };
    }

    if (targetPath === sourcePath) {
        return { valid: false, reason: 'Cannot drop node into itself' };
    }

    if (targetPath.startsWith(sourcePath + '.')) {
        return { valid: false, reason: 'Cannot drop node into its own descendant' };
    }

    const sourceNode = getNodeByPath(data, sourcePath);
    const targetNode = getNodeByPath(data, targetPath);

    let dropTarget = targetNode;
    if (position === 'before' || position === 'after') {
        const parentParts = targetPath.split('.').slice(0, -1);
        const parentPath = parentParts.join('.');
        dropTarget = parentParts.length ? getNodeByPath(data, parentPath) : { children: data, type: 'root' };
    }

    if (!sourceNode || !targetNode || !dropTarget) {
        return { valid: false, reason: 'Source or target node not found' };
    }

    if (!canNodeAcceptChild(dropTarget, sourceNode, nodeTypes)) {
        const sourceType = sourceNode.type || 'custom';
        const targetType = dropTarget.type || 'custom';
        const allowedChildren = dropTarget.allowedChildren || nodeTypes[targetType]?.allowedChildren || [];
        return { valid: false, reason: `Node type '${targetType}' cannot accept children of type '${sourceType}'. Allowed: [${allowedChildren.join(', ')}]` };
    }

    return { valid: true, reason: null };
}
