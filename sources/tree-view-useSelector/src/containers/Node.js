import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import * as actions from '../actions'

const Node  = ({ id, parentId }) => {
  const dispatch = useDispatch();
  const { counter, childIds } = useSelector(state => state[id]);

  const handleIncrementClick = () => {
    dispatch(actions.increment(id));
  };

  handleAddChildClick = e => {
    e.preventDefault()

    const action = actions.createNode();
    dispatch(action);
    dispatch(actions.addChild(id, action.nodeId));
  };

  handleRemoveClick = e => {
    e.preventDefault()

    dispatch(actions.removeChild(parentId, id));
    dispatch(actions.deleteNode(id));
  };

  const renderChild = childId => (
    <li key={childId}>
      <Node id={childId} parentId={id} />
    </li>
  );

  return (
    <div>
      Counter #{id}: {counter}
      {' '}
      <button className="increment" onClick={handleIncrementClick}>
        +
      </button>
      {' '}
      {typeof parentId !== 'undefined' &&
        <a href="#" className="deleteNode" onClick={handleRemoveClick} // eslint-disable-line jsx-a11y/href-no-hash
           style={{ color: 'lightgray', textDecoration: 'none' }}>
          Delete
        </a>
      }
      <ul>
        {childIds.map(renderChild)}
        <li key="add">
          <a href="#" className="addChild" // eslint-disable-line jsx-a11y/href-no-hash
            onClick={handleAddChildClick}
          >
            Add child
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Node;
