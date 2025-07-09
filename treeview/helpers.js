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
    console.log('moveNode called with:', { sourcePath, targetPath, position });
    
    const sourceNode = getNodeByPath(data, sourcePath);
    if (!sourceNode) {
        console.error('Source node not found at path:', sourcePath);
        return false;
    }
    
    // Get target references BEFORE removing source (paths may change after removal)
    const targetNode = getNodeByPath(data, targetPath);
    if (!targetNode) {
        console.error('Target node not found at path:', targetPath);
        return false;
    }
    
    console.log('Source node:', sourceNode.label, 'Target node:', targetNode.label);

    const clone = JSON.parse(JSON.stringify(sourceNode));
    
    if (position === 'before' || position === 'after') {
        // For sibling insertion, we need the parent
        const targetParts = targetPath.split('.');
        const parentPath = targetParts.slice(0, -1).join('.');
        const parentNode = parentPath ? getNodeByPath(data, parentPath) : { children: data };
        const targetIndex = Number(targetParts[targetParts.length - 1]);
        
        if (!parentNode || !parentNode.children) {
            console.error('Parent node or children not found');
            return false;
        }
        
        console.log('Sibling insertion - Parent:', parentNode.label || 'root', 'Target index:', targetIndex);
        
        // Remove source node first
        removeNodeFromPath(data, sourcePath);
        
        // Adjust insertion index if needed
        let insertIndex = targetIndex;
        if (position === 'after') {
            insertIndex += 1;
        }
        
        // If source was in same parent and came before target, adjust index
        const sourceParts = sourcePath.split('.');
        if (sourceParts.length === targetParts.length && 
            sourceParts.slice(0, -1).join('.') === parentPath) {
            const sourceIndex = Number(sourceParts[sourceParts.length - 1]);
            if (sourceIndex < targetIndex) {
                insertIndex -= 1;
            }
        }
        
        // Ensure index is within bounds
        insertIndex = Math.max(0, Math.min(insertIndex, parentNode.children.length));
        
        console.log('Final insertion index:', insertIndex);
        parentNode.children.splice(insertIndex, 0, clone);
        
    } else {
        // Insert as child (inside)
        console.log('Child insertion into:', targetNode.label);
        
        // Remove source node first
        removeNodeFromPath(data, sourcePath);
        
        if (!targetNode.children) {
            targetNode.children = [];
        }
        
        targetNode.children.push(clone);
        targetNode.expanded = true; // Expand to show the new child
    }
    
    console.log('Move completed successfully');
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
