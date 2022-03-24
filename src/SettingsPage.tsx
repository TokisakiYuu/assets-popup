import React, { FC, useEffect } from 'react'
import { Form, Switch, Slider, Button, message } from 'antd'
import { useSaveCompressionConfig, useGetCompressionConfig } from './lib/hooks'

const { Item } = Form

interface Props {
  token: string
}

const SettingPage: FC<Props> = () => {
  const [form] = Form.useForm()
  const config = useGetCompressionConfig()
  const saveConfig = useSaveCompressionConfig()

  useEffect(() => {
    form.setFieldsValue(config)
  }, [config])

  const handleSave = async () => {
    const data = await form.validateFields()
    await saveConfig(data)
  }

  return (
    <div>
      <Form form={form}>
        <Item
          label="是否默认开启压缩"
          name="enabled"
          valuePropName="checked"
          normalize={value => value ? 0 : 1}
          getValueProps={value => ({ checked: value === 0 })}
        >
          <Switch />
        </Item>
        <Item
          noStyle
          shouldUpdate
        >
          {() => (
            <Item
              label="默认压缩比例"
              name={['config', 'ratio']}
            >
              <Slider
                style={{ maxWidth: 300 }}
                tipFormatter={value => `${value}%`}
                max={100}
                min={10}
                disabled={form.getFieldValue('enabled') === 1}
              />
            </Item>
          )}
        </Item>
        <Item>
          <Button type="primary" onClick={handleSave}>保存</Button>
        </Item>
      </Form>
    </div>
  )
}

export default SettingPage
