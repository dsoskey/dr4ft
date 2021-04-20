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
import { CardDefault } from '../card/CardDefault';

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
    zone: keyof DraftState;
    column: string;
}
export const CardList = ({ cards, zone, column }: CardListProps<Card>) => (
    <>
        {cards.length > 0 ? (cards.map((card, index) => (
            <Draggable key={card.cardId} draggableId={`cardski__${JSON.stringify(card)}`} index={index}>
                {({ innerRef, draggableProps, dragHandleProps }) => (
                    <div ref={innerRef} {...draggableProps} {...dragHandleProps}>
                        <div className='faux-card'><CardDefault card={card} zoneName={zone} column={column} /></div>
                    </div>
                )}
            </Draggable>
        ))): <div style={{ width: '182px' }}></div>}
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
export const onDragEnd = async ({ destination, source, draggableId}: DropResult, provided: ResponderProvided) => {
    if (destination) {
        const [, draggedCardJSON] = draggableId.split('__');
        const draggedCard: Card = JSON.parse(draggedCardJSON);
        // parse keys into card lists

        const [_srcUiComponent, srcZone, srcColumnId] = source.droppableId.split('-');
        const [_destUiComponent, destZone, destColumnId] = destination.droppableId.split('-');

        if (source.droppableId === destination.droppableId) {
            // reorder given card list
            app.reorderCard(srcZone as any, srcColumnId, source.index, destination.index, draggedCard);
        } else {
            // move card from source to destination list
            // TODO: Execute synchronously after moveCard
            if(srcZone === 'pack') {
                // This only handles the single pick case.
                // TODO: Handle multi-pick
                // - can picks be undone?
                // - can multipick even drag from packs? TODO: disable dragging
                if (app.state.burnsPerPack === 0 && app.state.picksPerPack === 1) {
                    app.state.gameState.updateCardPick(draggedCard.cardId, app.state.picksPerPack);
                    app.state.gameState.resetPack();
                    app.update();
                    app.moveCard(srcZone, Number.parseInt(srcColumnId), destZone as any, Number.parseInt(destColumnId), draggedCard);
                } else {
                    console.error('multipick not supported through drag and drop yet.');
                }
            } else {
                app.moveCard(srcZone as any, Number.parseInt(srcColumnId), destZone as any, Number.parseInt(destColumnId), draggedCard);
            }
        }
    }
}   

const stringCards = ['a!', 'b@', 'c#', 'd$', 'e%', 'f^', 'g&', 'h(', 'i)', 'j_', 'k+'];
export const Canvas = () => {
    const { draftState } = app.state.gameState;
    const [drawerState, setDrawerState] = useState<DrawerState>(DrawerState.CLOSED);

    let drawerComponent = null;
    switch (drawerState) {
    case DrawerState.SIDEBOARD:
        drawerComponent = (
            <DroppableContainer className='drawer-inner side' droppableId={`column-side-0`} isDropDisabled={drawerState !== DrawerState.SIDEBOARD}>
                <CardList cards={draftState.state.side[0].items} zone='side' column='0' />
            </DroppableContainer>
        );
        break;
    case DrawerState.BURN:
        drawerComponent = (
            <DroppableContainer className='drawer-inner burn' droppableId={`column-burn-0`} isDropDisabled={drawerState !== DrawerState.BURN}>
                <CardList cards={draftState.state.burn[0].items} zone='burn' column='0' />
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
        <DragDropContext onDragEnd={onDragEnd}>
            <div className='draft-container'>
                <div className='primary-frame'>
                    {draftState.state.pack[0] && (
                        <DroppableContainer isDropDisabled droppableId={`column-pack-0`} direction='horizontal'>
                            <CardList cards={draftState.state.pack[0].items} column='0' zone='pack' />
                        </DroppableContainer>
                    )}
                    
                    <div className='main-container'>
                        {Object.values(draftState.state.main).map((column, index) => (
                            <DroppableContainer className='column' key={column.id} droppableId={`column-main-${index}`}>
                                <CardList cards={column.items} column={column.id} zone='main' />
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
