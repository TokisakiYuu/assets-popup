import React, { FC, useEffect, useState } from 'react'
import { css, cx } from '@emotion/css'

interface Props {
  dataSource: GroupSource[]
  onClickGroup: (group: GroupSource) => void
  active: string
}

export interface GroupSource {
  id: string
  name: string
  count: number
}

const GroupList: FC<Props> = ({
  dataSource,
  onClickGroup,
  active
}) => {
  return (
    <div className={style}>
      {dataSource.map(group => (
        <div
          key={group.id}
          className={cx(itemStyle, { 'active': group.id === active })}
          onClick={() => onClickGroup(group)}
        >
          <div className="name">{group.name}</div>
          <div className="count">{group.count}</div>
        </div>
      ))}
    </div>
  )
}

const style = css({
  height: '100%',
  flexBasis: 200,
  flexGrow: 0,
  flexShrink: 0,
  border: '1px solid rgba(0,0,0,.06)'
})

const itemStyle = css({
  padding: '10px 16px',
  display: 'flex',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  color: '#000000d9',
  transition: 'background-color .5s, color .5s',
  '.count': {
    marginLeft: 'auto'
  },
  '&:hover': {
    color: '#1890ff'
  },
  '&.active': {
    backgroundColor: '#e6f7ff',
    color: '#1890ff'
  }
})

export default GroupList
