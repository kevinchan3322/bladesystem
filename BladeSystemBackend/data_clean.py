# -*- coding: utf-8 -*-
"""
Created on Sat Mar  2 23:22:59 2024

@author: e2595
"""

#套件
import pandas as pd
import json
import sys
from datetime import datetime


# 函數
# 1. 刪除重複紀錄、2. 檢查是否有缺失值
def preprocess_sheet(sheet_name):
    # Load the sheet
    df = pd.read_excel(file_path, sheet_name=sheet_name)
    
    # 移除重複列
    df_dropped = df.drop_duplicates()
    
    # 檢查缺失值
    missing_values = df_dropped.isnull().sum()
    
    # 計算處理前後的數據量
    row_count_before = df.shape[0]
    row_count_after = df_dropped.shape[0]
    
    return {
        "分頁名稱": sheet_name,
        "dataframe":df_dropped,
        "原始資料量": row_count_before,
        "移除重複的資料量": row_count_after,
        "缺失值": missing_values
    }

# 檢查日期格式錯誤
def validate_date_format(df, date_columns):
    incorrect_dates = {}
    for column in date_columns:
        incorrect_format = []
        # 使用 items() 替代 iteritems()
        for index, value in df[column].items():
            try:
                # 嘗試轉換日期
                pd.to_datetime(value)
            except ValueError as e:
                # 若有 ValueError，記錄索引和值
                incorrect_format.append((index+2, value))
        if incorrect_format:
            incorrect_dates[column] = incorrect_format
    return incorrect_dates

# 生成從最舊日期開始，每天兩個固定時間點（早上8:00和下午1:00）的時間序列
def generate_time_series(start_date):
    end_date = pd.Timestamp.now().normalize()  # 使用當前日期作為結束時間，並去除時間部分只保留日期
    # 生成日期範圍
    dates = pd.date_range(start=start_date.normalize(), end=end_date, freq='D')
    # 對於每個日期，生成兩個具體時間點：早上8點和下午1點
    #print([date.replace(hour=13, minute=0) for date in dates][-1])
    times = pd.DatetimeIndex([date.replace(hour=8, minute=0) for date in dates]).append(pd.DatetimeIndex([date.replace(hour=13, minute=0) for date in dates])).sort_values()
    return times


def main(file_path, file_sheet, output_csv_path, output_json_path,is_train):
    # 讀取資料
    xls = pd.ExcelFile(file_path)
    # 紀錄資訊
    process_info = {}
    process_info.setdefault('重複資料與缺失值', {})
    process_info.setdefault('日期錯誤', {})
    process_info.setdefault('缺少資料表或特定欄位', {})
    process_info.setdefault('缺少重要的關聯資料', {})
    # Display the sheet names to understand the structure
    sheet_names = xls.sheet_names
    
    
    # 紀錄資訊：是否八個需要的分頁都有
    missing_sheets = [sheet for sheet in file_sheet if sheet not in sheet_names]
    if len(missing_sheets) > 0:
        process_info['缺少資料表或特定欄位']['Excel 缺少必要的分頁'] = missing_sheets
        #print('提供的 Excel 缺少正確的分頁')
        
    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)
    
    # Re-apply the updated preprocessing function to all sheets and return the cleaned dataframes
    cleaned_dataframes_info = {sheet_name: preprocess_sheet(sheet_name) for sheet_name in file_sheet}
    
    # 紀錄資訊：Return summary information (excluding the full dataframes for brevity)
    process_info['重複資料與缺失值'] = {sheet: {"分頁名稱": info["分頁名稱"], "原始資料量": info["原始資料量"], "移除重複後的資料量": info["移除重複的資料量"], "缺失值數量":str(info["缺失值"].sum())} for sheet, info in cleaned_dataframes_info.items()}
    #print({sheet: {"分頁名稱": info["分頁名稱"], "原始資料量": info["原始資料量"], "移除重複的資料量": info["移除重複的資料量"], "缺失值": info["缺失值"]} for sheet, info in cleaned_dataframes_info.items()})
    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)
    
    # 從工單與報工開始進行
    work_orders = cleaned_dataframes_info["工單"]["dataframe"]
    work_records = cleaned_dataframes_info["報工紀錄"]["dataframe"]
    
    # 檢查欄位
    work_orders_col = ['工單編號', '加工機台', '工單數量 (加工數量)', '加工部位', '物料號碼 (零件品號)', '開始時間 (工單計畫)',
           '結束時間 (工單計畫)']
    work_records_col = ['工單編號', '實際加工數量', '加工開始時間 (實際）', '加工完成時間 (實際）', '物料號碼', '加工機台', '加工部位']
    
    # 紀錄資訊：工單缺少的資料
    
    if len([i for i in work_orders_col if i not in work_orders.columns]) > 0:
        process_info['缺少資料表或特定欄位']['工單缺少的欄位'] = [i for i in work_orders_col if i not in work_orders.columns]
        #print('工單缺少必要的欄位資訊')
    
    # 紀錄資訊：報工缺少的資料
    if len([i for i in work_records_col if i not in work_records.columns]) > 0:
        process_info['缺少資料表或特定欄位']['報工缺少的欄位'] = [i for i in work_orders_col if i not in work_orders.columns]
        #print('報工缺少必要的欄位資訊')
    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)
    
    # Date columns to check in both dataframes
    work_orders_date_columns = ['開始時間 (工單計畫)', '結束時間 (工單計畫)']
    work_records_date_columns = ['加工開始時間 (實際）', '加工完成時間 (實際）']
    
    # Validate date formats and identify incorrect dates
    incorrect_dates_work_orders = validate_date_format(work_orders, work_orders_date_columns)
    incorrect_dates_work_records = validate_date_format(work_records, work_records_date_columns)
    
    # 紀錄資訊：工單日期錯誤
    if len(incorrect_dates_work_orders) !=0:
        process_info['日期錯誤']['工單日期格式錯誤'] = incorrect_dates_work_orders
        #print(incorrect_dates_work_orders)
    # 紀錄資訊：報工日期錯誤
    if len(incorrect_dates_work_records) !=0:
        process_info['日期錯誤']['報工日期格式錯誤'] = incorrect_dates_work_records
        #print(incorrect_dates_work_records)
    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)
    
    # 移除未命名的欄位
    work_records = work_records.drop(columns=[col for col in work_records.columns if 'Unnamed' in col])
    work_orders = work_orders.drop(columns=[col for col in work_orders.columns if 'Unnamed' in col])
    
    
    # Correct the key names for merging
    merged_data_corrected = pd.merge(
        work_orders[['工單編號', '加工機台', '工單數量 (加工數量)', '物料號碼 (零件品號)', '加工部位']], 
        work_records[['工單編號', '加工機台', '實際加工數量', '加工開始時間 (實際）', '加工完成時間 (實際）', '物料號碼', '加工部位']], 
        left_on=["工單編號", "加工部位", "物料號碼 (零件品號)"],
        right_on=["工單編號", "加工部位", "物料號碼"],
        how="right",
        suffixes=('_工單', '_報工')
    )
    
    # Identify work order numbers in work records that do not have a corresponding entry in work orders
    missing_work_orders_1 = merged_data_corrected[merged_data_corrected['加工機台_工單'].isnull()]['工單編號'].unique()
    missing_work_orders_2 = merged_data_corrected[merged_data_corrected['加工機台_工單'].isnull()]['加工部位'].unique()
    missing_work_orders_3 = merged_data_corrected[merged_data_corrected['加工機台_工單'].isnull()]['物料號碼'].unique()
    
    # 紀錄資訊：缺少的工單編號
    if len(missing_work_orders_1)>0:
        process_info['缺少重要的關聯資料']['工單中缺少的工單編號、加工部位、物料號碼'] = json.dumps((missing_work_orders_1).tolist()+(missing_work_orders_2).tolist()+(missing_work_orders_3).tolist(), ensure_ascii=False)
    
    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)
    
    # Drop the duplicate "物料號碼 (零件品號)" column
    merged_data_corrected = merged_data_corrected.drop(columns=["物料號碼 (零件品號)"])
    
    # Rename columns for clarity
    merged_data_renamed = merged_data_corrected.rename(columns={
        '加工機台_工單': '工單加工機台',
        '加工機台_報工': '報工加工機台',
        '工單數量 (加工數量)': '工單加工數量(總數量)',
        '實際加工數量': '報工加工數量',
        '加工開始時間 (實際）': '加工開始時間',
        '加工完成時間 (實際）': '加工完成時間'
    })
    
    
    # Selecting only the requested columns for the final merged dataframe
    final_columns = ['工單編號', '工單加工機台', '報工加工機台', '工單加工數量(總數量)', '物料號碼', '報工加工數量', '加工開始時間', '加工完成時間', '加工部位']
    final_merged_data_corrected = merged_data_renamed[final_columns]
    
    
    
    # Remove records with work order numbers that do not have a corresponding entry in work orders 缺少的部分暫時不處理
    #final_merged_data_corrected = final_merged_data_corrected[~final_merged_data_corrected['工單編號'].isin(missing_work_orders)]
    
    # Sort the cleaned data by 工單編號, 物料號碼, 加工部位
    final_merged_data_corrected = final_merged_data_corrected.sort_values(by=['工單編號', '加工部位', '物料號碼'])
    
    # Extract the 加工零件規格 dataframe
    machining_specifications = cleaned_dataframes_info["加工零件規格"]["dataframe"]
    
    # 檢查必要欄位
    machining_specifications_col = ['物料號碼', '加工件材質', '零件類型', '熱處理']
    # 紀錄資訊：加工零件規格缺少的資料
    if len([i for i in machining_specifications_col if i not in machining_specifications.columns]) > 0:
        process_info['缺少資料表或特定欄位']['加工零件規格缺少的欄位'] = [i for i in machining_specifications_col if i not in machining_specifications.columns]
        #print('報工缺少必要的欄位資訊')
    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)
        
    # 移除未命名的欄位
    machining_specifications = machining_specifications.drop(columns=[col for col in machining_specifications.columns if 'Unnamed' in col])
    
    # Merge the sorted and cleaned data with 加工零件規格 on 物料號碼
    final_merged_data_corrected = pd.merge(
        final_merged_data_corrected,
        machining_specifications,
        left_on="物料號碼",
        right_on="物料號碼",
        how="left"
    )
    
    # Identify material numbers in the merged data that do not have corresponding specifications in the machining specifications
    missing_material_numbers = final_merged_data_corrected[final_merged_data_corrected['加工件材質'].isnull()]['物料號碼'].unique()
    
    # 紀錄資訊：缺少的加工零件資訊
    if len(missing_material_numbers)>0:
        process_info['缺少重要的關聯資料']['加工零件規格中缺少的物料編號'] = json.dumps((missing_material_numbers).tolist())
        #print('在加工零件規格中缺少的物料編號:',missing_material_numbers)
    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)
    
    # Extract the 加工任務規格 dataframe
    task_specifications = cleaned_dataframes_info["加工任務規格"]["dataframe"]
    # 檢查必要欄位
    task_specifications_col = ['物料號碼', '加工部位', '加工任務', '下刀工時 (秒)', '刀片規格', '零件部位']
    # 紀錄資訊：加工零件規格缺少的資料
    if len([i for i in task_specifications_col if i not in task_specifications.columns]) > 0:
        process_info['缺少資料表或特定欄位']['加工任務規格缺少的欄位'] = [i for i in task_specifications_col if i not in task_specifications.columns]

    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)

    # 移除未命名的欄位
    task_specifications = task_specifications.drop(columns=[col for col in task_specifications.columns if 'Unnamed' in col])
    
    # Merge the final merged data with 加工任務規格 on 物料號碼 and 加工部位
    final_merged_data_corrected = pd.merge(
        final_merged_data_corrected,
        task_specifications,
        left_on=["物料號碼", "加工部位"],
        right_on=["物料號碼", "加工部位"],
        how="left"
    )
    
    # Identify material numbers in the merged data that do not have corresponding task specifications in the task specifications
    missing_task_spec_material_numbers_1 = final_merged_data_corrected[final_merged_data_corrected['刀片規格'].isnull()]['物料號碼'].unique()
    missing_task_spec_material_numbers_2 = final_merged_data_corrected[final_merged_data_corrected['刀片規格'].isnull()]['加工部位'].unique()

    # 紀錄資訊：缺少的加工任務資訊
    if len(missing_task_spec_material_numbers_1)>0:
        process_info['缺少重要的關聯資料']['加工任務規格中缺少的物料號碼、加工部位'] = json.dumps((missing_task_spec_material_numbers_1).tolist()+(missing_task_spec_material_numbers_2).tolist(), ensure_ascii=False)
        #print('在加工任務規格中缺少的物料編號:',missing_task_spec_material_numbers)
    
    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)
    
    #以上為加工資料
    ###########################################################################################################################
    #以下為刀片紀錄
    
    # Extract the 換刀紀錄 dataframe
    change_record = cleaned_dataframes_info["換刀紀錄"]["dataframe"]
    # 檢查必要欄位
    change_record_col = ['狀態', '刀片編號', '刀片規格', '刀柄編號', '時間', '機台']
    # 紀錄資訊：換刀紀錄缺少的資料
    if len([i for i in change_record_col if i not in change_record.columns]) > 0:
        process_info['缺少資料表或特定欄位']['換刀紀錄缺少的欄位'] = [i for i in change_record_col if i not in change_record.columns]

    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)

    
    # Sort the 換刀紀錄 data by 機台, 刀柄編號, 刀片規格, 時間
    change_record = change_record.sort_values(by=['機台', '刀柄編號', '刀片規格', '時間'])
    
    # 檢查時間欄位的格式
    change_record_time_validated = validate_date_format(change_record, ['時間'])
    
    # 紀錄資訊：換刀紀錄 日期有錯誤請修正
    if len(change_record_time_validated) !=0:
        process_info['日期錯誤']['換刀紀錄日期格式錯誤'] = change_record_time_validated
        #print(change_record_time_validated)
        
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)

    # 創造刀片身分證
    change_record['刀片身份證'] = change_record['機台'] + '_' + \
                                   change_record['刀柄編號'] + '_' + \
                                   change_record['刀片規格'] + '_' + \
                                   change_record['刀片編號'].astype(str)
    
    # 移除換刀紀錄中不重要的狀態 ('淘汰','架機', '閒置')
    change_record = change_record[~change_record['狀態'].isin(['淘汰', '閒置'])]
    
    # 創造刀片位置
    change_record['刀片位置'] = change_record['機台'] + '_' + \
                                   change_record['刀柄編號'] + '_' + \
                                   change_record['刀片規格']
    
    
    # 創造刀片位置的每一天
    oldest_dates = change_record.groupby('刀片位置')['時間'].min().reset_index()
    
    # 應用生成時間序列的函數到每一行
    oldest_dates['日期時間序列'] = oldest_dates['時間'].apply(generate_time_series)
    
    # 展開日期時間序列，以便每個時間點都有一個行
    expanded_dates = oldest_dates.explode('日期時間序列')
    
    # 移除不合理的日期（即“日期”大於“日期時間序列”的行）
    expanded_dates = expanded_dates[expanded_dates['時間'] <= expanded_dates['日期時間序列']]
    
    #更改欄位名稱
    expanded_dates = expanded_dates.rename(columns={'日期時間序列':'刀片預測時間'})
    
    del expanded_dates['時間']
    
    # 基於過濾後的日期再次創造資料表
    change_record = change_record.rename(columns={'時間':'換刀時間'})
    
    
    # 对df1按“刀片位置”和“換刀时间”排序
    change_record = change_record.sort_values(by=['刀片位置', '換刀時間'])
    
    # 创建一个新的DataFrame来存储结果
    results = pd.DataFrame(columns=['刀片位置', '刀片預測時間', '換刀時間'])
    
    # 对每个“刀片位置”分组
    for position, group in change_record.groupby('刀片位置'):
        # 遍历每个“換刀时间”
        for i in range(len(group)):
            start_change = group.iloc[i]['換刀時間']
            end_change = group.iloc[i+1]['換刀時間'] if i+1 < len(group) else pd.Timestamp('now')
            # 选择“预测时间”位于“換刀时间”之后，且在下一次“換刀时间”之前的记录
            mask = (expanded_dates['刀片位置'] == position) & (expanded_dates['刀片預測時間'] >= start_change) & (expanded_dates['刀片預測時間'] <= end_change)
            predictions = expanded_dates[mask]
            # 如果有预测记录，添加到结果DataFrame中
            if not predictions.empty:
                predictions.loc[:,['換刀時間']] = start_change
                results = pd.concat([results, predictions])
    
    results['機台'] = results['刀片位置'].apply(lambda x: x[:4])
    results['刀柄編號'] = results['刀片位置'].apply(lambda x: x[5:9])
    results['刀片規格'] = results['刀片位置'].apply(lambda x: x[10:])
    
    # Extract the 刀片規格 dataframe
    target_spec = cleaned_dataframes_info["刀片規格"]["dataframe"]
    # 檢查必要欄位
    target_spec_col = ['刀片規格', '刀片材質']
    # 紀錄資訊：刀片規格缺少的資料
    if len([i for i in target_spec_col if i not in target_spec.columns]) > 0:
        process_info['缺少資料表或特定欄位']['刀片規格缺少的欄位'] = [i for i in target_spec_col if i not in target_spec.columns]

    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)
        
    results = pd.merge(
        results,
        target_spec,
        left_on="刀片規格",
        right_on="刀片規格",
        how="left"
    )
    
    # 檢查缺少的刀片材質
    missing_target_spec = results[results['刀片材質'].isnull()]['刀片規格'].unique()
    
    # 紀錄資訊：刀片規格缺少資訊
    if len(missing_target_spec)>0:
        process_info['缺少重要的關聯資料']['刀片規格中缺少的刀片規格'] = json.dumps((missing_target_spec).tolist())
        #print('在刀片規格中缺少的刀片規格:',missing_target_spec)
    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)
        
    # Extract the 刀柄規格 dataframe
    hilt_spec = cleaned_dataframes_info["刀柄規格"]["dataframe"]
    # 檢查必要欄位
    hilt_spec_col = ['刀柄編號', '刀柄規格', '刀片規格', '零件部位']
    # 紀錄資訊：刀柄規格缺少的資料
    if len([i for i in hilt_spec_col if i not in hilt_spec.columns]) > 0:
        process_info['缺少資料表或特定欄位']['刀柄規格缺少的欄位'] = [i for i in hilt_spec_col if i not in hilt_spec.columns]

    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)
    # 移除未命名的欄位
    hilt_spec = hilt_spec.drop(columns=[col for col in hilt_spec.columns if 'Unnamed' in col])
    
    results = pd.merge(
        results,
        hilt_spec,
        left_on=["刀柄編號","刀片規格"],
        right_on=["刀柄編號","刀片規格"],
        how="left"
    )

    # 檢查缺少的刀柄規格
    missing_hilt_spec = results[results['零件部位'].isnull()]['刀柄編號'].unique()
    missing_hilt_target_spec = results[results['零件部位'].isnull()]['刀片規格'].unique()
    
    # 紀錄資訊：刀柄規格缺少資訊
    if len(missing_hilt_spec)>0:
        process_info['缺少重要的關聯資料']['刀柄規格中缺少的刀柄編號與刀片規格'] = json.dumps((missing_hilt_spec).tolist()+(missing_hilt_target_spec).tolist())
        #print('在刀柄規格中缺少的刀柄規格:',missing_hilt_spec)
        
    # Extract the 補刀紀錄 dataframe
    CS_record = cleaned_dataframes_info["補刀紀錄"]["dataframe"]
    # 檢查必要欄位
    CS_record_col = ['刀片編號', '補刀時間', '補刀長度(mm)', '工作中心 (加工機台)', '刀片規格', '刀柄編號']
    # 紀錄資訊：補刀紀錄缺少的資料
    if len([i for i in CS_record_col if i not in CS_record.columns]) > 0:
        process_info['缺少資料表或特定欄位']['補刀紀錄缺少的欄位'] = [i for i in CS_record_col if i not in CS_record.columns]

    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)

    # 修正補刀紀錄中 機台的欄位名稱
    CS_record = CS_record.rename(columns={'工作中心 (加工機台)':'機台'})
    
    # 檢查時間欄位的格式
    CS_record_time_validated = validate_date_format(CS_record, ['補刀時間'])
    
    # 紀錄資訊：補刀紀錄 日期有錯誤請修正
    if len(CS_record_time_validated) !=0:
        process_info['日期錯誤']['補刀紀錄日期格式錯誤'] = CS_record_time_validated
        #print(CS_record_time_validated)
    #輸出紀錄
    with open(output_json_path, 'w', encoding='utf_8_sig') as f:
        json.dump(process_info, f, ensure_ascii=False, indent=4)
        
    # 創造刀片位置
    CS_record['刀片位置'] = CS_record['機台'] + '_' + \
                                   CS_record['刀柄編號'] + '_' + \
                                   CS_record['刀片規格']
    
    # 在original_df中添加一个新列用于存放“累積補刀長度”
    results['累積補刀長度'] = 0.0
    
    # 遍历original_df的每一行
    for idx, row in results.iterrows():
        position = row['刀片位置']
        start_time = row['換刀時間']
        end_time = row['刀片預測時間']
    
        # 在new_df中找到匹配的“刀片位置”且“補刀时间”在指定范围内的行
        mask = (CS_record['刀片位置'] == position) & (CS_record['補刀時間'] >= start_time) & (CS_record['補刀時間'] <= end_time)
        matching_rows = CS_record[mask]
    
        # 如果有匹配的行，累加它们的“補刀長度”
        if not matching_rows.empty:
            results.loc[idx, '累積補刀長度'] = matching_rows['補刀長度(mm)'].sum()
    
    
    #################################################################################################
    #以下產出刀片加工履歷
    
    
    #嘗試串聯刀片加工履歷，results + final_merged_data_corrected
    
    # 移除不必要欄位
    final_merged_data_corrected = final_merged_data_corrected.drop(columns=['工單加工機台','工單編號','工單加工數量(總數量)'])
    # 統一欄位名稱
    final_merged_data_corrected = final_merged_data_corrected.rename(columns={'報工加工機台':'機台'})
    
    #創造特徵 (固定特徵，避免之後新增特徵造成錯誤)
    object_location_col = ['車', '車A面', '車B面', '精修頭部', '車C面', '粗車頭部', '車錐度孔', '車滾花外徑']#加工部位
    for i in object_location_col:
        results[i+'的累積加工數量'] = 0.0
    
    object_met_col = ['SAE4135~4140', 'SAE1045']#加工件材質
    for j in object_met_col:
        results[j+'的累積加工數量'] = 0.0
    
    object_type_col = ['螺栓', '主體']#零件類型
    for k in object_type_col:
        results[k+'的累積加工數量'] = 0.0
    
    mission_col = ['粗車', '精修']#加工任務
    for l in mission_col:
        results[l+'的累積加工數量'] = 0.0
    
    results['熱處理的累積加工數量'] = 0.0
    results['累積下刀工時'] = 0.0
    results['累積加工數量'] = 0.0
    # 遍历original_df的每一行
    for idx, row in results.iterrows():
        machine = row['機台']
        target_spec = row['刀片規格']
        object_location = row['零件部位']
        start_time = row['換刀時間']
        end_time = row['刀片預測時間']
    
        # 在new_df中找到匹配的“刀片位置”且“補刀时间”在指定范围内的行
        mask = (final_merged_data_corrected['機台'] == machine) & (final_merged_data_corrected['刀片規格'] == target_spec) & (final_merged_data_corrected['零件部位'] == object_location) & (final_merged_data_corrected['加工開始時間'] >= start_time) & (final_merged_data_corrected['加工完成時間'] <= end_time)
        matching_rows = final_merged_data_corrected[mask]
    
        # 如果有匹配的行，進行以下計算(可以加入更多特徵，後續再補)
        if not matching_rows.empty:
            results.loc[idx, '累積加工數量'] = matching_rows['報工加工數量'].sum() #累積加工數量
            results.loc[idx, '累積下刀工時'] = (matching_rows['報工加工數量'] * matching_rows['下刀工時 (秒)']).sum() #累積下刀工時
            
            for i in object_location_col:
                temp = matching_rows[matching_rows['加工部位'] == i]
                if not temp.empty:
                    results.loc[idx, i+'的累積加工數量'] = temp['報工加工數量'].sum()
            for j in object_met_col:
                temp = matching_rows[matching_rows['加工件材質'] == j]
                if not temp.empty:
                    results.loc[idx, j+'的累積加工數量'] = temp['報工加工數量'].sum()
            for k in object_type_col:
                temp = matching_rows[matching_rows['零件類型'] == k]
                if not temp.empty:
                    results.loc[idx, k+'的累積加工數量'] = temp['報工加工數量'].sum()
            for l in mission_col:
                temp = matching_rows[matching_rows['加工任務'] == l]
                if not temp.empty:
                    results.loc[idx, l+'的累積加工數量'] = temp['報工加工數量'].sum()
            temp = matching_rows[matching_rows['熱處理'] == True]
            if not temp.empty:
                results.loc[idx, '熱處理的累積加工數量'] = temp['報工加工數量'].sum()
            
    
    
    #新增 是否換刀 欄位(創造目標欄位)
    results['是否換刀'] = 0.0
    for position, group in results.groupby('刀片位置'):
        change_time = group['換刀時間'].unique()
        if len(change_time)>1:
            change_time = change_time[1:]
            for i in change_time:     
                results.loc[results[(results['刀片位置'] == position) & (results['換刀時間'] < i) & (results['刀片預測時間'] <= i)].index[-1], '是否換刀'] = 1.0
    
    #新增預測or訓練用的判斷參數
    currentDateAndTime = datetime.now() #當下時間
    if not is_train:
        if currentDateAndTime.strftime("%H:%M:%S") <= '13:00:00':#8:00後 13:00前
            tmp_time = currentDateAndTime.replace(hour=8, minute=0, second = 0).strftime("%Y-%m-%d %H:%M:%S")
            results = results[results['刀片預測時間'] == tmp_time]
        else:#13:00後
            tmp_time = currentDateAndTime.replace(hour=13, minute=0, second = 0).strftime("%Y-%m-%d %H:%M:%S")
            results = results[results['刀片預測時間'] == tmp_time]
        
        
    #刪除不必要的欄位
    del results['刀片預測時間'],results['換刀時間']
    
    #刪除重複資料(除了預測目標以外)
    temp = results['是否換刀']
    del results['是否換刀']
    kill_index = results.duplicated(keep = 'last')
    results = results[~kill_index]
    temp = temp[~kill_index]
    results.loc[:,['是否換刀']] = temp
    
    #改變是否換刀的型態
    results['是否換刀'] = results['是否換刀'].replace({0: 'A', 1: 'B'})

    
    #輸出資料
    results.to_csv(output_csv_path,encoding = 'utf_8_sig')


def pre_upload_check(file_path, output_json_path):
    """

    讀取 excel 檔案後，檢查是否有重複的 "刀片位置" 和 "時間"
    如果有錯誤，將重複的結果輸出為 json 檔，讓前端做顯示

    如果沒有錯誤，則篩選出最新狀態為 "上線" 和 "下線" 的資料，提供後續預測 API 進行分類
    Args:
        file_path (str): 要讀取的 excel 檔案路徑
        output_json_path (str): 輸出的 json 檔案路徑

    Returns:
        bool: True = 檢查通過, False = 檢查失敗
    """
    data = pd.read_excel(file_path, sheet_name='換刀紀錄')

    df = pd.DataFrame(data)

    CS_record_time_validated = validate_date_format(df, ['時間'])

    error_dc = {}

    if len(CS_record_time_validated) !=0:
        error_dc = {
            "日期錯誤": {
                "補刀紀錄日期格式錯誤": CS_record_time_validated
                }
        }

        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump(error_dc, f, ensure_ascii=False, indent=4)

            return False

    df['時間'] = pd.to_datetime(df['時間'])

    df['combination'] = df['刀片編號'] + '_' + \
                    df['刀片規格'] + '_' + \
                    df['刀柄編號'] + '_' + \
                    df['機台']
    
    # 檢查每個 "combination" 是否有重複的 "時間"
    duplicate_times_df = df[df.duplicated(subset=["combination", "時間"], keep=False)]

    error_dc = {}

    if not duplicate_times_df.empty:
        error_dc = {
            "換刀紀錄日期錯誤": list(duplicate_times_df['combination'].unique())
        }

    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(error_dc, f, ensure_ascii=False, indent=4)

    if error_dc.keys():
        return False
    
    # 依照時間做排序，並且刪除重複的資料 = 每筆刀片位置只留最新的
    correct_latest_status_df = df.sort_values(by=["時間"], ascending=[False]).drop_duplicates(subset=["combination"], keep="first")

    for i in correct_latest_status_df.index:
        m = correct_latest_status_df.loc[i, '機台']
        n = correct_latest_status_df.loc[i, '刀柄編號']
        s = correct_latest_status_df.loc[i, '刀片規格']

        correct_latest_status_df.loc[i, '刀片位置'] = m + '_' + n + '_' + s
    
    latest_status_df = correct_latest_status_df.drop_duplicates(subset=["刀片位置"], keep="first")

    output_ls = []

    for i in latest_status_df.index:
        row = latest_status_df.loc[i]

        status = row['狀態']
        position = row['刀片位置']

        output_ls.append({
            "status": status,
            "position": position,
        })

    with open('./docs/pre_file_check_result.json', 'w', encoding='utf_8_sig') as f:
        json.dump({
            'output': output_ls
        }, f, ensure_ascii=False, indent=4)

    return True

if __name__ == "__main__":
    # 輸入的參數
    file_path = sys.argv[1]
    file_sheet = ['工單','報工紀錄','換刀紀錄','刀柄規格','補刀紀錄','刀片規格','加工任務規格','加工零件規格']
    output_csv_path = r'./docs/file_check_result.csv'
    output_json_path = r'./docs/file_check_result.json'

    pre_upload_check_result = pre_upload_check(file_path, output_json_path)

    if not pre_upload_check_result:
        pass
    else:
        is_train = eval(sys.argv[2])# True=訓練用,False=預測用
        main(file_path, file_sheet, output_csv_path, output_json_path,is_train)
