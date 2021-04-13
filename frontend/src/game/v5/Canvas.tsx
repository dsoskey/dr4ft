import React, { useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DroppableProps, DropResult, ResponderProvided } from 'react-beautiful-dnd';
import _get from 'lodash/get';
import _set from 'lodash/set';
import _range from 'lodash/range';
import _cloneDeep from 'lodash/cloneDeep';
import _isEqual from 'lodash/isEqual';
import './style.css';
// TODO: Move common types to a more shallow dir
import { Card } from 'common/src/types/card';
import { app } from '../../router';
import { CardBase } from '../card/CardBase';
import { Zone } from '../../zones';

enum DrawerState {
    CLOSED = '',
    SIDEBOARD = 'side',
    BURN = 'burn',
    CHAT = 'chat',
}

/**
 * 2 types of actions
 * any two different droppableIds are a move.
 * any same droppableIds are a reorder.
 * syntax: <UI_COMPONENT-CARD_ZONE-COLUMN_ID>
 * CARD_ZONE: PACK | SIDE | BURN | MAIN
 * UI_COMPONENT: BUTTON | COLUMN
 * COLUMN_ID: string
 */
const legalMoves = [
    'pack-main',
    'pack-side',
    'pack-burn',
    'main-main',
    'main-side',
    'side-side',
    'side-main',
];

const CardComponent = ({ card }: any) => <div className='faux-card'>{card}</div>;

export interface ColumnState<T> {
    id: string; // By default is the key for the sort order
    items: T[];
}
export interface DraftState<C=Card> {
    pack: Record<string, ColumnState<C>>;
    main: Record<string, ColumnState<C>>;
    // Design for plurality: I need one column for the draft but the deckbuilding screen should eventually have multiple columns
    side: Record<string, ColumnState<C>>;
    burn: Record<string, ColumnState<C>>;
}

export interface CardListProps<C=Card> {
    cards: C[];
}
export const CardList = ({ cards }: CardListProps<Card>) => (
    <>
        {cards.map((card, index) => (
            <Draggable key={card.cardId} draggableId={`cardski__${JSON.stringify(card)}`} index={index}>
                {({ innerRef, draggableProps, dragHandleProps }) => (
                    <div ref={innerRef} {...draggableProps} {...dragHandleProps}>
                        <div className='faux-card'><CardBase card={card} /></div>
                    </div>
                )}
            </Draggable>
        ))}
    </>
);

export interface DroppableContainerProps extends Omit<DroppableProps, 'children'> {
    className?: string;
    children: React.ReactNode;
}
export const DroppableContainer = ({ className, children, ...props }: DroppableContainerProps) => (
    <Droppable {...props}>
        {({ innerRef, droppableProps, placeholder }) => (
            <div ref={innerRef} {...droppableProps} className={className}>
                {children}
                {placeholder}
            </div>
        )}
    </Droppable>
);

// TODO: handle same card with different instances
export const onDragEnd = (
        columnState: DraftState<Card>,
        setColumnState: (newColumnState: DraftState<Card>) => void,
) => ({ destination, source, draggableId}: DropResult, provided: ResponderProvided) => {
    if (destination) {
        const [, draggedCardJSON] = draggableId.split('__');
        const draggedCard = JSON.parse(draggedCardJSON);

        const newColumnState = _cloneDeep(columnState);
        // parse keys into card lists

        const [_srcUiComponent, srcZone, srcColumnId] = source.droppableId.split('-');
        const sourceKeys = [srcZone, srcColumnId, 'items'];
        let sourceCardList: string[] | undefined = _get(newColumnState, sourceKeys);
        const [_destUiComponent, destZone, destColumnId] = destination.droppableId.split('-');
        const destinationKeys = [destZone, destColumnId, 'items'];
        let destinationCardList: string[] | undefined = _get(newColumnState, destinationKeys);

        // if (source.droppableId === destination.droppableId) {
        //     // reorder given card list
        //     app.state.gameState.reorderCard(srcZone as any, srcColumnId, source.index, destination.index, draggedCard);
        // } else {
        //     // move card from source to destination list
        //     app.state.gameState.moveCard(srcZone as any, srcColumnId, destZone as any, destColumnId, draggedCard);
        // }
        // return;

        if (sourceCardList === undefined) {
            throw Error(`source(${source.droppableId}) not found.`);

        } else if (destinationCardList === undefined) {
            throw Error(`destination(${destination.droppableId}) not found.`);
        }
        else if (legalMoves.includes(`${srcZone}-${destZone}`)) {
            if (source.droppableId === destination.droppableId) {
                // reorder given card list
                destinationCardList.splice(source.index, 1);
                destinationCardList.splice(destination.index, 0, draggedCard);
            } else {
                // move card from source to destination list
                sourceCardList = sourceCardList.filter((card) => !_isEqual(card, draggedCard));
                destinationCardList.push(draggedCard);
            }
        } else {
            console.debug(`illegal move from ${srcZone} to ${destZone}. Ignoring`);
        }
        _set(newColumnState, sourceKeys, sourceCardList);
        _set(newColumnState, destinationKeys, destinationCardList);
        setColumnState(newColumnState);
    }
}   

const stringCards = ['a!', 'b@', 'c#', 'd$', 'e%', 'f^', 'g&', 'h(', 'i)', 'j_', 'k+'];
export const Canvas = () => {
    // const { draftState } = app.state.gameState;
    const [drawerState, setDrawerState] = useState<DrawerState>(DrawerState.CLOSED);
    const [columnState, setColumnState] = useState<DraftState<Card>>({
        pack: {
            '0': { id: '0', items: Object.values(app.getSortedZone(Zone.pack)).flat() },
        },
        main: {
            '0': {  id: '0', items: [] },
            '1': {  id: '1', items: [] },
            '2': {  id: '2', items: [] },
            '3': {  id: '3', items: [] },
            '4': {  id: '4', items: [] },
        },
        side: { '0': { id: '0', items: [] } },
        burn: { '0': { id: '0', items: [] } },
    });
    console.debug(JSON.stringify(columnState));

    let drawerComponent = null;
    switch (drawerState) {
    case DrawerState.SIDEBOARD:
        drawerComponent = (
            <DroppableContainer className='drawer-inner side' droppableId={`column-side-0`} isDropDisabled={drawerState !== DrawerState.SIDEBOARD}>
                <CardList cards={columnState.side['0'].items} />
            </DroppableContainer>
        );
        break;
    case DrawerState.BURN:
        drawerComponent = (
            <DroppableContainer className='drawer-inner burn' droppableId={`column-burn-0`} isDropDisabled={drawerState !== DrawerState.BURN}>
                <CardList cards={columnState.burn['0'].items} />
            </DroppableContainer>
        );
        break;
    case DrawerState.CHAT:
        drawerComponent = (
            <div className='drawer-inner chatski'>
                I'm a chat!!!!
            </div>
        );
        break;
    }

    return (
        <DragDropContext onDragEnd={onDragEnd(columnState, setColumnState)}>
            <div className='draft-container'>
                <div className='primary-frame'>
                    <DroppableContainer isDropDisabled droppableId={`column-pack-0`} direction='horizontal'>
                        <CardList cards={columnState.pack['0'].items} />
                    </DroppableContainer>

                    <div className='main-container'>
                        {Object.values(columnState.main).map((column) => (
                            <DroppableContainer className='column' key={column.id} droppableId={`column-main-${column.id}`}>
                                <CardList cards={column.items} />
                            </DroppableContainer>
                        ))}
                    </div>
                </div>
                <div className={`drawer ${drawerState !== DrawerState.CLOSED ? 'open':'close'}`}>
                    <div className='drawer-handle'>
                        <Droppable droppableId={`button-side-0`}>
                            {({ innerRef, droppableProps, placeholder }) => (
                                <div ref={innerRef} {...droppableProps}>
                                    <button
                                        className={drawerState === DrawerState.SIDEBOARD ? 'side' : ''}
                                        onClick={() => setDrawerState(drawerState === DrawerState.SIDEBOARD ? DrawerState.CLOSED : DrawerState.SIDEBOARD)}
                                    >
                                        Side
                                    </button>
                                    {placeholder}
                                </div>
                            )}
                        </Droppable>
                        <Droppable droppableId={`button-burn-0`}>
                            {({ innerRef, droppableProps, placeholder }) => (
                                <div ref={innerRef} {...droppableProps}>
                                    <button
                                        className={drawerState === DrawerState.BURN ? 'burn' : ''}
                                        onClick={() => setDrawerState(drawerState === DrawerState.BURN ? DrawerState.CLOSED : DrawerState.BURN)}
                                    >
                                        Burn
                                    </button>
                                    {placeholder}
                                </div>
                            )}
                        </Droppable>
                        <button
                            className={drawerState === DrawerState.CHAT ? 'chatski' : ''}
                            onClick={() => setDrawerState(drawerState === DrawerState.CHAT ? DrawerState.CLOSED : DrawerState.CHAT)}
                        >
                            Chat
                        </button>
                    </div>
                    {drawerComponent}
                </div>
            </div>
        </DragDropContext>
    );
};
